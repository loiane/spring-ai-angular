import { Observable } from 'rxjs';

/**
 * A single parsed Server-Sent Event.
 *
 * @param event The event name. Defaults to `"message"` when the server does
 *              not send an explicit `event:` line (e.g. plain `Flux<T>` SSE
 *              responses from Spring MVC).
 * @param data  The parsed payload. JSON payloads are parsed automatically;
 *              anything that fails to parse as JSON is returned as a raw string.
 */
export interface SseEvent<T = unknown> {
  event: string;
  data: T;
}

const DEFAULT_EVENT_NAME = 'message';

/**
 * Sends a POST request and streams back the response body as Server-Sent Events.
 *
 * Native `EventSource` only supports `GET` requests, so this uses `fetch` with a
 * `ReadableStream` reader to manually parse the `text/event-stream` wire format
 * (`event:` / `data:` lines separated by blank lines).
 *
 * The returned Observable emits one {@link SseEvent} per server-sent message,
 * completes when the stream ends, and aborts the underlying request if the
 * subscription is unsubscribed early.
 *
 * @param url  The endpoint to POST to.
 * @param body The request body, serialized as JSON.
 */
export function postSse<T = unknown>(url: string, body: unknown): Observable<SseEvent<T>> {
  return new Observable<SseEvent<T>>(subscriber => {
    const controller = new AbortController();

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    })
      .then(async response => {
        if (!response.ok || !response.body) {
          throw new Error(`SSE request to ${url} failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const rawEvents = buffer.split('\n\n');
          buffer = rawEvents.pop() ?? '';

          for (const rawEvent of rawEvents) {
            const parsed = parseSseEvent<T>(rawEvent);
            if (parsed) {
              subscriber.next(parsed);
            }
          }
        }

        subscriber.complete();
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        subscriber.error(err);
      });

    return () => controller.abort();
  });
}

function parseSseEvent<T>(rawEvent: string): SseEvent<T> | null {
  let eventName = DEFAULT_EVENT_NAME;
  const dataLines: string[] = [];

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const rawData = dataLines.join('\n');
  return { event: eventName, data: parseData<T>(rawData) };
}

function parseData<T>(rawData: string): T {
  try {
    return JSON.parse(rawData) as T;
  } catch {
    return rawData as unknown as T;
  }
}
