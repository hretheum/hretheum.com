// Client-side utility to consume SSE from /api/rag/query
// All comments/documentation in English (per project rules)

export type RagTokenEvent = { type: 'token'; token: string };
export type RagDoneEvent = {
  type: 'done';
  citations: Array<{ quote: string; source_name: string; link?: string }>;
  intent: { id: string; confidence: number };
  lowConfidence?: boolean;
};
export type RagEvent = RagTokenEvent | RagDoneEvent;

export type StreamOptions = {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
  onDone?: (done: RagDoneEvent) => void;
  onError?: (err: unknown) => void;
  fetchImpl?: typeof fetch; // for tests
};

// Async generator to iterate over SSE events
export async function* streamRag(
  message: string,
  opts: StreamOptions = {}
): AsyncGenerator<RagEvent, void, unknown> {
  const fetcher = opts.fetchImpl ?? fetch;
  const res = await fetcher(`/api/rag/query?stream=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ message }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`RAG stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames separated by double newlines
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!frame.startsWith('data:')) continue;
        const data = frame.replace(/^data:\s*/, '');
        if (!data) continue;
        try {
          const evt: RagEvent = JSON.parse(data);
          if (evt.type === 'token') {
            opts.onToken?.(evt.token);
            yield evt;
          } else if (evt.type === 'done') {
            opts.onDone?.(evt as RagDoneEvent);
            yield evt;
          }
        } catch (e) {
          // ignore malformed frames
          opts.onError?.(e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
