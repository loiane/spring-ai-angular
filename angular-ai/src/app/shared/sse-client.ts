import { HttpClient, HttpDownloadProgressEvent, HttpEventType } from '@angular/common/http';
import { inject, Service } from '@angular/core';
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
 * Streams Server-Sent Events over POST requests.
 *
 * Native `EventSource` only supports `GET` requests, so this parses the
 * `text/event-stream` wire format (`event:` / `data:` lines separated by blank
 * lines) from the response body as it arrives. It is built on Angular's
 * `HttpClient` (download-progress events expose the partial response text), so
 * HTTP interceptors — auth headers, logging, etc. — apply to streaming requests
 * the same way they do to regular ones.
 *
 * The returned Observable emits one {@link SseEvent} per server-sent message,
 * completes when the stream ends, and cancels the underlying request if the
 * subscription is unsubscribed early.
 */
@Service()
export class SseClient {

  private readonly http = inject(HttpClient);

  /**
   * Sends a POST request and streams back the response body as Server-Sent Events.
   *
   * @param url  The endpoint to POST to.
   * @param body The request body, serialized as JSON.
   */
  post<T = unknown>(url: string, body: unknown): Observable<SseEvent<T>> {
    return new Observable<SseEvent<T>>(subscriber => {
      // Index into the (cumulative) response text up to which complete
      // frames have already been emitted.
      let processed = 0;

      const emitFrames = (text: string, streamEnded: boolean): void => {
        const frames = text.slice(processed).split('\n\n');
        const remainder = streamEnded ? '' : frames.pop() ?? '';
        processed = text.length - remainder.length;

        for (const frame of frames) {
          const parsed = parseSseEvent<T>(frame);
          if (parsed) {
            subscriber.next(parsed);
          }
        }
      };

      const subscription = this.http.post(url, body, {
        headers: { Accept: 'text/event-stream' },
        observe: 'events',
        responseType: 'text',
        reportProgress: true
      }).subscribe({
        next: event => {
          if (event.type === HttpEventType.DownloadProgress) {
            emitFrames((event as HttpDownloadProgressEvent).partialText ?? '', false);
          } else if (event.type === HttpEventType.Response) {
            emitFrames(event.body ?? '', true);
          }
        },
        error: err => subscriber.error(err),
        complete: () => subscriber.complete()
      });

      return () => subscription.unsubscribe();
    });
  }
}

function parseSseEvent<T>(rawEvent: string): SseEvent<T> | null {
  let eventName = DEFAULT_EVENT_NAME;
  const dataLines: string[] = [];

  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      // Do NOT trim the payload: raw-string SSE data (e.g. streamed answer
      // deltas) may legitimately start or end with whitespace, and Spring
      // writes "data:" with no padding space. Trimming here would silently
      // glue streamed words together.
      dataLines.push(line.slice('data:'.length));
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
