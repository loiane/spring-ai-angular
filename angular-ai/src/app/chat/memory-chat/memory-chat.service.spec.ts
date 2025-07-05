import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MemoryChatService } from './memory-chat.service';
import { Chat } from '../chat';
import { ChatMessage, ChatType } from '../chat-message';

describe('MemoryChatService', () => {
  let service: MemoryChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MemoryChatService]
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
      const mockChat: Chat = { id: '123', description: 'Test chat' };
      const message = 'Hello, world!';

      service.startNewChat(message).subscribe(chat => {
        expect(chat).toEqual(mockChat);
      });

      const req = httpMock.expectOne('/api/chat-memory/start');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message });
      req.flush(mockChat);
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

  describe('getChatHistory', () => {
    it('should get chat history for a specific chat', () => {
      const mockMessages: ChatMessage[] = [
        { content: 'User message', type: ChatType.USER },
        { content: 'AI response', type: ChatType.ASSISTANT }
      ];
      const chatId = '123';

      service.getChatHistory(chatId).subscribe(messages => {
        expect(messages).toEqual(mockMessages);
      });

      const req = httpMock.expectOne(`/api/chat-memory/${chatId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMessages);
    });
  });

  describe('getAllChats', () => {
    it('should get all chats', () => {
      const mockChats: Chat[] = [
        { id: '1', description: 'Chat 1' },
        { id: '2', description: 'Chat 2' }
      ];

      service.getAllChats().subscribe(chats => {
        expect(chats).toEqual(mockChats);
      });

      const req = httpMock.expectOne('/api/chat-memory');
      expect(req.request.method).toBe('GET');
      req.flush(mockChats);
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
