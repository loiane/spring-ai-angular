import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ChatService } from './chat-service';
import { ChatResponse } from './chat-response';

function sseResponse(body: string, status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    }
  });
  return new Response(stream, { status, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ChatService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Make sure that there are no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendChatMessage', () => {
    it('should send a message and return the chat response', () => {
      const mockMessage = 'Hello, AI!';
      const mockResponse: ChatResponse = { message: 'AI says hi!', isBot: true };

      service.sendChatMessage(mockMessage).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(service.API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: mockMessage });
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      const mockMessage = 'Test error';
      const errorMessage = 'Something went wrong';

      service.sendChatMessage(mockMessage).subscribe({
        next: () => expect.unreachable('should have failed with an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(service.API);
      expect(req.request.method).toBe('POST');
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });

    it('should send message with correct API endpoint', () => {
      const mockMessage = 'Test message';
      const mockResponse: ChatResponse = { message: 'Response', isBot: true };

      service.sendChatMessage(mockMessage).subscribe();

      const req = httpMock.expectOne(service.API);
      expect(req.request.url).toBe('/api/chat');
      req.flush(mockResponse);
    });
  });

  describe('sendChatMessageStream', () => {
    let fetchSpy: ReturnType<typeof vi.spyOn>;

    afterEach(() => {
      fetchSpy?.mockRestore();
    });

    it('should POST to the stream endpoint and emit text deltas', async () => {
      const body = 'data: {"message":"Hel"}\n\ndata: {"message":"lo"}\n\n';
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse(body));

      const deltas: string[] = [];
      await new Promise<void>((resolve, reject) => {
        service.sendChatMessageStream('hi').subscribe({
          next: delta => deltas.push(delta),
          error: reject,
          complete: resolve
        });
      });

      expect(deltas).toEqual(['Hel', 'lo']);
      expect(fetchSpy).toHaveBeenCalledWith(`${service.API}/stream`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'hi' })
      }));
    });
  });
});
