import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ChatService } from './chat-service';
import { ChatResponse } from './chat-response';

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

      const req = httpMock.expectOne('/api/chat');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: mockMessage });
      req.flush(mockResponse);
    });

    it('should handle HTTP errors', () => {
      const mockMessage = 'Test error';
      const errorMessage = 'Something went wrong';

      service.sendChatMessage(mockMessage).subscribe({
        next: () => fail('should have failed with an error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne('/api/chat');
      expect(req.request.method).toBe('POST');
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });
});
