import { Observable } from 'rxjs';
import { postSse, SseEvent } from './sse-client';

function sseResponse(body: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    }
  });
  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' }
  });
}

describe('postSse', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('parses events without an explicit event name as "message"', async () => {
    const body = 'data: {"message":"Hel"}\n\ndata: {"message":"lo"}\n\n';
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(body));

    const events = await collect(postSse('/api/chat/stream', { message: 'hi' }));

    expect(events).toEqual([
      { event: 'message', data: { message: 'Hel' } },
      { event: 'message', data: { message: 'lo' } }
    ]);
  });

  it('parses events with an explicit event name', async () => {
    const body = 'event: answer\ndata: "Hel"\n\nevent: sources\ndata: [{"filename":"a.pdf"}]\n\n';
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(body));

    const events = await collect(postSse('/api/rag/ask/stream', { question: 'hi', documentId: '1' }));

    expect(events).toEqual([
      { event: 'answer', data: 'Hel' },
      { event: 'sources', data: [{ filename: 'a.pdf' }] }
    ]);
  });

  it('sends a POST request with a JSON body and SSE accept header', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(''));

    await collect(postSse('/api/chat/stream', { message: 'hi' }));

    expect(fetchSpy).toHaveBeenCalledWith('/api/chat/stream', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'hi' }),
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      })
    }));
  });

  it('errors when the response is not ok', async () => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse('', 500));

    await expect(collect(postSse('/api/chat/stream', { message: 'hi' }))).rejects.toThrow();
  });
});

function collect<T>(source: Observable<SseEvent<T>>): Promise<SseEvent<T>[]> {
  return new Promise((resolve, reject) => {
    const results: SseEvent<T>[] = [];
    source.subscribe({
      next: value => results.push(value),
      error: reject,
      complete: () => resolve(results)
    });
  });
}
