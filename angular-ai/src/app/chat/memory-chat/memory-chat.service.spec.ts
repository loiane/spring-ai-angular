import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MemoryChatService } from './memory-chat.service';
import { Chat, ChatStartResponse } from '../chat';
import { ChatMessage, ChatType } from '../chat-message';

describe('MemoryChatService', () => {
  let service: MemoryChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        MemoryChatService
      ]
    });
    service = TestBed.inject(MemoryChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startNewChat', () => {
    it('should start a new chat with first message', () => {
      const mockChatStartResponse: ChatStartResponse = {
        chatId: '123',
        message: 'AI response',
        description: 'Test chat'
      };
      const message = 'Hello, world!';

      service.startNewChat(message).subscribe(chatStartResponse => {
        expect(chatStartResponse).toEqual(mockChatStartResponse);
      });

      const req = httpMock.expectOne('/api/chat-memory/start');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message });
      req.flush(mockChatStartResponse);
    });
  });

  describe('continueChat', () => {
    it('should continue chat with subsequent message', () => {
      const mockResponse: ChatMessage = { content: 'AI response', type: ChatType.ASSISTANT };
      const chatId = '123';
      const message = 'Follow-up message';

      service.continueChat(chatId, message).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`/api/chat-memory/${chatId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message });
      req.flush(mockResponse);
    });
  });

  describe('selectChat', () => {
    it('should set the selected chat ID', () => {
      const chatId = '123';
      service.selectChat(chatId);
      expect(service.selectedChatId()).toBe(chatId);
    });
  });

  describe('clearSelection', () => {
    it('should clear the selected chat ID', () => {
      service.selectChat('123');
      service.clearSelection();
      expect(service.selectedChatId()).toBeUndefined();
    });
  });
});
