'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Citation = { quote: string; source_name: string; link?: string };

export default function RagChat() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; citations?: Citation[] }[]>([]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      const assistantMsg = typeof data?.answer === 'string' ? data.answer : 'Unexpected response';
      const citations: Citation[] = Array.isArray(data?.citations) ? data.citations : [];
      setMessages((m) => [...m, { role: 'assistant', content: assistantMsg, citations }]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again later.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-[360px] md:w-[420px] p-2">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="max-h-60 overflow-y-auto p-2 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-500">
                Ask about competencies, experience, leadership approach, or case studies. I will cite sources from the portfolio.
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    'inline-block max-w-full rounded-2xl px-3 py-2 text-sm ' +
                    (m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-900 border border-gray-200')
                  }
                >
                  {m.role === 'assistant' ? (
                    (() => {
                      const parts = m.content.split('\n\nNote: ');
                      const main = parts[0];
                      const note = parts[1] ? 'Note: ' + parts[1] : '';
                      return (
                        <div>
                          <div className="prose prose-sm prose-zinc max-w-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{main}</ReactMarkdown>
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
                  {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                    <div className="mt-2 border-t border-gray-200 pt-2 text-xs text-gray-700">
                      <div className="font-medium text-gray-700">Sources</div>
                      <ul className="mt-1 list-disc pl-4 space-y-1">
                        {m.citations.map((c, i) => {
                          const clean = c.quote.replace(/\*\*|__|#+|\*|`|>+/g, '').replace(/\s+/g, ' ').trim();
                          const truncated = clean.length > 180 ? clean.slice(0, 177) + '…' : clean;
                          return (
                            <li key={i}>
                              <span className="italic">“{truncated}”</span>
                              <span className="text-[11px] text-gray-500"> — <span className="font-medium text-gray-700">{c.source_name}</span></span>
                              {c.link && (
                                <>
                                  {' '}
                                  <a className="text-indigo-600 hover:underline" href={c.link} target="_blank" rel="noreferrer">
                                    link
                                  </a>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-900">
                  Thinking…
                </div>
              </div>
            )}
          </div>
          <form onSubmit={onSend} className="flex items-center gap-2 border-t border-gray-200 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
    </div>
  );
}
