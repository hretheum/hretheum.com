'use client';

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamRag } from '@/lib/client/streamRag';

type Citation = { quote: string; source_name: string; link?: string };

export default function RagChat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; citations?: Citation[] }[]>([]);
  const [minimized, setMinimized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const tokenBufferRef = useRef<string>('');
  const flushTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const gtmEnabled = (process.env.NEXT_PUBLIC_ENABLE_GTM ?? 'true') !== 'false';
  const chatVariant = process.env.NEXT_PUBLIC_CHAT_VARIANT || 'default';
  // Thread management for stable pairing in admin: thread_id + turn_index
  const threadIdRef = useRef<string>('');
  const turnIndexRef = useRef<number>(0);

  // Lightweight GTM dataLayer push helper (no PII)
  function dlPush(payload: Record<string, any>) {
    if (!gtmEnabled) return;
    try {
      // ensure event name present and push to dataLayer
      if (!payload || !payload.event) return;
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(payload);
    } catch {}
  }

  // Load minimized state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem('ragChatMinimized');
      if (saved === '1') setMinimized(true);
      if (saved === '0') setMinimized(false);
    } catch {}
  }, []);

  // Initialize persistent thread_id for this chat widget (session lifetime)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let tid = window.sessionStorage.getItem('ragThreadId') || '';
      if (!tid) {
        // generate UUID (best-effort)
        const uuid = (window.crypto && (window.crypto as any).randomUUID) ? (window.crypto as any).randomUUID() : `tid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        tid = uuid;
        window.sessionStorage.setItem('ragThreadId', tid);
      }
      threadIdRef.current = tid;
      const savedTurn = window.sessionStorage.getItem('ragTurnIndex');
      turnIndexRef.current = savedTurn ? parseInt(savedTurn, 10) || 0 : 0;
    } catch {}
  }, []);

  // Persist minimized state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('ragChatMinimized', minimized ? '1' : '0');
    } catch {}
  }, [minimized]);

  // Fire chat_open once per session when panel is first shown
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!gtmEnabled) return;
    if (!minimized) {
      try {
        const key = 'ragChat_open_sent';
        if (window.sessionStorage.getItem(key) !== '1') {
          dlPush({
            event: 'chat_interaction',
            chat_action: 'chat_open',
            chat_widget: 'custom-react',
            chat_variant: chatVariant,
          });
          window.sessionStorage.setItem(key, '1');
        }
      } catch {}
    }
  }, [minimized]);

  // Load input draft from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const draft = window.localStorage.getItem('ragChatDraft');
      if (draft) setInput(draft);
    } catch {}
  }, []);

  function setDraft(val: string) {
    setInput(val);
    try {
      if (val) {
        window.localStorage.setItem('ragChatDraft', val);
      } else {
        window.localStorage.removeItem('ragChatDraft');
      }
    } catch {}
  }

  // ESC to minimize
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMinimized(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Auto-scroll to bottom when messages update or while streaming
  useEffect(() => {
    if (!bottomRef.current) return;
    // Use instant scroll during streaming to keep up with tokens
    bottomRef.current.scrollIntoView({ behavior: loading ? 'instant' as ScrollBehavior : 'smooth' });
  }, [messages, loading]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    // reset state for a new turn (no escalation state)

    // cancel any in-flight stream
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Telemetry: chat_message_sent (no message text)
    try {
      dlPush({
        event: 'chat_interaction',
        chat_action: 'chat_message_sent',
        message_len: message.length,
        chat_widget: 'custom-react',
        chat_variant: chatVariant,
      });
    } catch {}

    // Capture current turn index and persist increment for next turn
    const currentTurn = turnIndexRef.current;
    try { turnIndexRef.current = currentTurn + 1; window.sessionStorage.setItem('ragTurnIndex', String(turnIndexRef.current)); } catch {}

    setMessages((m) => [...m, { role: 'user', content: message }]);
    setDraft('');
    setLoading(true);

    // create empty assistant placeholder and stream into it
    let assistantIndex = -1;
    setMessages((m) => {
      assistantIndex = m.length; // new index after pushing user
      return [...m, { role: 'assistant', content: '' }];
    });

    try {
      // start throttled flush of token buffer with punctuation-based pauses
      tokenBufferRef.current = '';
      if (flushTimerRef.current) window.clearInterval(flushTimerRef.current);
      const baseInterval = 45; // ms (natural pace)
      const scheduleFlush = () => {
        flushTimerRef.current = window.setInterval(() => {
          if (pauseTimerRef.current) return; // currently in a pause
          const chunk = tokenBufferRef.current;
          if (!chunk) return;
          tokenBufferRef.current = '';
          setMessages((m) => {
            const copy = m.slice();
            const last = copy[assistantIndex];
            if (last && last.role === 'assistant') {
              copy[assistantIndex] = { ...last, content: (last.content || '') + chunk };
            }
            return copy;
          });
          // If the last emitted characters suggest a sentence/paragraph end, insert a short pause
          const tail = chunk.slice(-6);
          if (/[\.!?…]["')\]]?\s?$/.test(tail) || /\n{2,}$/.test(tail)) {
            // pause ~250ms
            if (flushTimerRef.current) {
              window.clearInterval(flushTimerRef.current);
              flushTimerRef.current = null;
            }
            pauseTimerRef.current = window.setTimeout(() => {
              pauseTimerRef.current = null;
              if (!flushTimerRef.current) scheduleFlush();
            }, 320) as unknown as number;
          }
        }, baseInterval) as unknown as number;
      };
      scheduleFlush();

      for await (const evt of streamRag(message, {
        signal: ctrl.signal,
        onToken: (t) => {
          tokenBufferRef.current += t;
        },
        onDone: (d) => {
          const citations: Citation[] = Array.isArray(d.citations) ? d.citations : [];
          const remainder = tokenBufferRef.current;
          tokenBufferRef.current = '';
          setMessages((m) => {
            const copy = m.slice();
            const last = copy[assistantIndex];
            if (last && last.role === 'assistant') {
              copy[assistantIndex] = { ...last, content: (last.content || '') + remainder, citations };
            }
            return copy;
          });
        },
        extraBody: { thread_id: threadIdRef.current || null, turn_index: currentTurn },
      })) {
        // events also handled via callbacks; loop keeps the generator flowing
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[assistantIndex];
        if (last && last.role === 'assistant') {
          copy[assistantIndex] = { ...last, content: (last.content || '') + '\n\n[Streaming error, please try again.]' } as any;
        } else {
          copy.push({ role: 'assistant', content: 'Sorry, something went wrong. Please try again later.' });
        }
        return copy;
      });
    } finally {
      setLoading(false);
      if (flushTimerRef.current) {
        window.clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      if (pauseTimerRef.current) {
        window.clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {minimized ? (
        <button
          aria-label="Open chat"
          onClick={() => setMinimized(false)}
          className="group inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span className="text-lg">💬</span>
        </button>
      ) : (
        <div
          className="w-[320px] sm:w-[360px] md:w-[420px] p-2 transition-transform duration-200 ease-out animate-in"
          style={{ transformOrigin: 'bottom right' }}
        >
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-3 py-2 text-xs text-gray-600">
              <div className="font-medium text-gray-700">Eryk Assistant</div>
              <button
                onClick={() => {
                  // Telemetry: chat_close
                  dlPush({
                    event: 'chat_interaction',
                    chat_action: 'chat_close',
                    chat_widget: 'custom-react',
                    chat_variant: chatVariant,
                  });
                  setMinimized(true);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-600 hover:bg-gray-200"
                title="Minimize"
                aria-label="Minimize chat"
              >
                –
              </button>
            </div>
            <div ref={listRef} className="max-h-56 sm:max-h-60 overflow-y-auto p-2 sm:p-2.5 space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">
                  Ask about competencies, experience, leadership approach, or case studies.
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={
                      'inline-block max-w-full rounded-2xl px-3 py-2 text-[13px] sm:text-sm ' +
                      (m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-900 border border-gray-200')
                    }
                  >
                    {m.role === 'assistant' ? (
                      (() => {
                        const parts = (m.content || '').split('\n\nNote: ');
                        const main = parts[0] || '';
                        const note = parts[1] ? 'Note: ' + parts[1] : '';
                        const isLast = idx === messages.length - 1;
                        const isThinking = loading && isLast && (!main || main.trim().length === 0);
                        return (
                          <div>
                            <div className="prose prose-xs sm:prose-sm prose-zinc max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                              {isThinking ? (
                                <div className="text-gray-500 select-none inline-flex items-center gap-2">
                                  <span>Thinking</span>
                                  <span className="inline-flex w-6 justify-between">
                                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '180ms' }} />
                                    <span className="w-1 h-1 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: '360ms' }} />
                                  </span>
                                </div>
                              ) : (
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{main}</ReactMarkdown>
                              )}
                            </div>
                            {note && (
                              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                                {note}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    )}
                    {/* Sources/citations UI removed per product decision */}
                  </div>
                </div>
              ))}
              
              <div ref={bottomRef} />
            </div>
            <form onSubmit={onSend} className="flex items-center gap-2 border-t border-gray-200 p-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about Eryk’s leadership, competencies, or experience…"
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
