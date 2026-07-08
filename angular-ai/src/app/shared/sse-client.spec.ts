import { HttpDownloadProgressEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SseClient, SseEvent } from './sse-client';

describe('SseClient', () => {
  let client: SseClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    client = TestBed.inject(SseClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function progressEvent(partialText: string): HttpDownloadProgressEvent {
    return { type: HttpEventType.DownloadProgress, loaded: partialText.length, partialText };
  }

  it('parses events without an explicit event name as "message"', () => {
    const events: SseEvent[] = [];
    let completed = false;
    client.post('/api/chat/stream', { message: 'hi' }).subscribe({
      next: event => events.push(event),
      complete: () => completed = true
    });

    const req = httpMock.expectOne('/api/chat/stream');
    const body = 'data: {"message":"Hel"}\n\ndata: {"message":"lo"}\n\n';
    req.event(progressEvent(body));
    req.flush(body);

    expect(events).toEqual([
      { event: 'message', data: { message: 'Hel' } },
      { event: 'message', data: { message: 'lo' } }
    ]);
    expect(completed).toBe(true);
  });

  it('parses events with an explicit event name', () => {
    const events: SseEvent[] = [];
    client.post('/api/rag/ask/stream', { question: 'hi', documentId: '1' })
      .subscribe(event => events.push(event));

    const req = httpMock.expectOne('/api/rag/ask/stream');
    // Spring writes "event:"/"data:" with no padding space
    const body = 'event:answer\ndata:Hel\n\nevent:sources\ndata:[{"filename":"a.pdf"}]\n\n';
    req.flush(body);

    expect(events).toEqual([
      { event: 'answer', data: 'Hel' },
      { event: 'sources', data: [{ filename: 'a.pdf' }] }
    ]);
  });

  it('preserves leading and trailing whitespace in raw-string data payloads', () => {
    const events: SseEvent[] = [];
    client.post('/api/rag/ask/stream', { question: 'hi', documentId: '1' })
      .subscribe(event => events.push(event));

    const req = httpMock.expectOne('/api/rag/ask/stream');
    req.flush('event:answer\ndata:Spring\n\nevent:answer\ndata: AI \n\n');

    expect(events).toEqual([
      { event: 'answer', data: 'Spring' },
      { event: 'answer', data: ' AI ' }
    ]);
  });

  it('emits events incrementally as partial text arrives, without duplicates', () => {
    const events: SseEvent[] = [];
    client.post('/api/chat/stream', { message: 'hi' }).subscribe(event => events.push(event));

    const req = httpMock.expectOne('/api/chat/stream');
    // First progress delivers one complete frame and one partial frame
    req.event(progressEvent('data: {"message":"Hel"}\n\ndata: {"mess'));
    expect(events).toEqual([{ event: 'message', data: { message: 'Hel' } }]);

    // Second progress completes the second frame (partialText is cumulative)
    const fullBody = 'data: {"message":"Hel"}\n\ndata: {"message":"lo"}\n\n';
    req.event(progressEvent(fullBody));
    req.flush(fullBody);

    expect(events).toEqual([
      { event: 'message', data: { message: 'Hel' } },
      { event: 'message', data: { message: 'lo' } }
    ]);
  });

  it('sends a POST request with a JSON body and SSE accept header', () => {
    client.post('/api/chat/stream', { message: 'hi' }).subscribe();

    const req = httpMock.expectOne('/api/chat/stream');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'hi' });
    expect(req.request.headers.get('Accept')).toBe('text/event-stream');
    req.flush('');
  });

  it('errors when the response is not ok', () => {
    let error: unknown;
    client.post('/api/chat/stream', { message: 'hi' }).subscribe({
      error: err => error = err
    });

    const req = httpMock.expectOne('/api/chat/stream');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(error).toBeTruthy();
  });

  it('cancels the underlying request when unsubscribed', () => {
    const subscription = client.post('/api/chat/stream', { message: 'hi' }).subscribe();

    const req = httpMock.expectOne('/api/chat/stream');
    subscription.unsubscribe();

    expect(req.cancelled).toBe(true);
  });
});
