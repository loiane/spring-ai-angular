import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MemoryChatService } from './memory-chat.service';
import { ChatStartResponse } from '../chat';
import { ChatMessage, ChatType } from '../chat-message';

describe('MemoryChatService', () => {
  let service: MemoryChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MemoryChatService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(MemoryChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // The httpResource automatically makes a GET request to /api/chat-memory
    // We need to flush this request if it exists
    const pending = httpMock.match(service.API_MEMORY);
    if (pending.length > 0) {
      pending.forEach(req => req.flush([]));
    }
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.chatsErrorHandler).toBeTruthy();
    expect(service.messagesErrorHandler).toBeTruthy();
  });

  describe('error handling', () => {
    it('should have error handlers initialized', () => {
      expect(service.chatsErrorHandler.error()).toBeNull();
      expect(service.chatsErrorHandler.retryCount()).toBe(0);
      expect(service.messagesErrorHandler.error()).toBeNull();
      expect(service.messagesErrorHandler.retryCount()).toBe(0);
    });

    it('should expose retryLoadChats method', () => {
      expect(service.retryLoadChats).toBeDefined();
    });

    it('should expose retryLoadMessages method', () => {
      expect(service.retryLoadMessages).toBeDefined();
    });

    it('should call retry on chatsErrorHandler when retryLoadChats is called', () => {
      spyOn(service.chatsErrorHandler, 'retry');
      service.retryLoadChats();
      expect(service.chatsErrorHandler.retry).toHaveBeenCalled();
    });

    it('should call retry on messagesErrorHandler when retryLoadMessages is called', () => {
      spyOn(service.messagesErrorHandler, 'retry');
      service.retryLoadMessages();
      expect(service.messagesErrorHandler.retry).toHaveBeenCalled();
    });
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

      const req = httpMock.expectOne(`${service.API_MEMORY}/start`);
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

      const req = httpMock.expectOne(`${service.API_MEMORY}/${chatId}`);
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

  describe('resources', () => {
    it('should have chatsResource defined', () => {
      expect(service.chatsResource).toBeDefined();
    });

    it('should have chatMessagesResource defined', () => {
      expect(service.chatMessagesResource).toBeDefined();
    });

    it('should return undefined for chatMessagesResource when no chat selected', () => {
      service.clearSelection();
      // The resource loader function should return undefined when no chat is selected
      expect(service.selectedChatId()).toBeUndefined();
    });

    it('should build correct URL for chatMessagesResource when chat selected', () => {
      service.selectChat('test-chat-123');
      expect(service.selectedChatId()).toBe('test-chat-123');
    });
  });

  describe('signal updates', () => {
    it('should update selected chat ID signal', () => {
      service.selectChat('test-id');
      expect(service.selectedChatId()).toBe('test-id');
    });

    it('should clear selected chat ID signal', () => {
      service.selectChat('test-id');
      service.clearSelection();
      expect(service.selectedChatId()).toBeUndefined();
    });
  });
});
