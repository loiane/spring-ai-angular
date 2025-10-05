import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { of, throwError } from 'rxjs';

import { ChatPanel } from './chat-panel';
import { MemoryChatService } from '../memory-chat.service';
import { ChatType } from '../../chat-message';
import { ChatStartResponse } from '../../chat';

class MockMemoryChatService {
  selectedChatId = jasmine.createSpy().and.returnValue(undefined);
  chatMessagesResource = {
    value: jasmine.createSpy().and.returnValue([]),
    status: jasmine.createSpy().and.returnValue('idle'),
    error: jasmine.createSpy().and.returnValue(null),
    reload: jasmine.createSpy()
  };
  chatsResource = {
    reload: jasmine.createSpy()
  };

  messagesErrorHandler = {
    error: jasmine.createSpy().and.returnValue(null),
    retryCount: jasmine.createSpy().and.returnValue(0),
    reset: jasmine.createSpy()
  };

  continueChat = jasmine.createSpy().and.returnValue(of({
    content: 'Response from AI',
    type: ChatType.ASSISTANT
  }));

  startNewChat = jasmine.createSpy().and.returnValue(of({
    chatId: 'new-chat-123',
    message: 'AI response',
    description: 'New chat started'
  }));

  selectChat = jasmine.createSpy();
  retryLoadMessages = jasmine.createSpy();
}

describe('ChatPanel', () => {
  let component: ChatPanel;
  let fixture: ComponentFixture<ChatPanel>;
  let mockMemoryChatService: MockMemoryChatService;

  beforeEach(async () => {
    mockMemoryChatService = new MockMemoryChatService();

    await TestBed.configureTestingModule({
      imports: [
        ChatPanel,
        FormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemoryChatService, useValue: mockMemoryChatService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.messages()).toEqual([]);
  });

  it('should not send empty message', () => {
    component.userInput.set('   ');
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should not send message when loading', () => {
    component.userInput.set('test message');
    component.isLoading = true;
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
  });

  it('should send message when valid input and not loading', () => {
    component.userInput.set('test message');
    component.isLoading = false;
    spyOn(component as any, 'sendChatMessage');
    spyOn(component as any, 'updateMessages');

    component.sendMessage();

    expect((component as any).updateMessages).toHaveBeenCalledWith('test message');
    expect(component.isLoading).toBe(true);
    expect((component as any).sendChatMessage).toHaveBeenCalled();
  });

  it('should update messages with user type by default', () => {
    const initialCount = component.messages().length;

    (component as any).updateMessages('test message');

    expect(component.messages().length).toBe(initialCount + 1);
    expect(component.messages()[0].content).toBe('test message');
    expect(component.messages()[0].type).toBe(ChatType.USER);
  });

  it('should update messages with specified type', () => {
    const initialCount = component.messages().length;

    (component as any).updateMessages('assistant message', ChatType.ASSISTANT);

    expect(component.messages().length).toBe(initialCount + 1);
    expect(component.messages()[0].content).toBe('assistant message');
    expect(component.messages()[0].type).toBe(ChatType.ASSISTANT);
  });

  it('should handle scrollToBottom without errors', () => {
    expect(() => (component as any).scrollToBottom()).not.toThrow();
  });

  it('should start new chat when no chat selected', () => {
    mockMemoryChatService.selectedChatId.and.returnValue(undefined);
    component.userInput.set('new chat message');

    (component as any).sendChatMessage('new chat message');

    expect(mockMemoryChatService.startNewChat).toHaveBeenCalledWith('new chat message');
  });

  it('should continue existing chat when chat selected', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('existing-chat-123');
    component.userInput.set('continue message');

    (component as any).sendChatMessage('continue message');

    expect(mockMemoryChatService.continueChat).toHaveBeenCalledWith('existing-chat-123', 'continue message');
  });

  it('should handle continue chat success', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.continueChat.and.returnValue(of({
      content: 'AI response',
      type: ChatType.ASSISTANT
    }));
    spyOn(component as any, 'updateMessages');
    component.userInput.set('test message');

    (component as any).sendChatMessage('test message');

    expect((component as any).updateMessages).toHaveBeenCalledWith('AI response', ChatType.ASSISTANT);
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle continue chat error', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.continueChat.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(component as any, 'updateMessages');
    component.userInput.set('test message');

    (component as any).sendChatMessage('test message');

    expect((component as any).updateMessages).toHaveBeenCalledWith(
      'Sorry, I am unable to process your request at the moment.',
      ChatType.ASSISTANT
    );
    expect(component.isLoading).toBe(false);
  });

  it('should handle start new chat success', () => {
    mockMemoryChatService.selectedChatId.and.returnValue(undefined);
    const mockResponse: ChatStartResponse = {
      chatId: 'new-chat-456',
      message: 'Welcome!',
      description: 'New chat'
    };
    mockMemoryChatService.startNewChat.and.returnValue(of(mockResponse));
    component.userInput.set('start new chat');

    (component as any).sendChatMessage('start new chat');

    expect(mockMemoryChatService.selectChat).toHaveBeenCalledWith('new-chat-456');
    expect(mockMemoryChatService.chatsResource.reload).toHaveBeenCalled();
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle start new chat error', () => {
    mockMemoryChatService.selectedChatId.and.returnValue(undefined);
    mockMemoryChatService.startNewChat.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(component as any, 'updateMessages');
    component.userInput.set('test message');

    (component as any).sendChatMessage('test message');

    expect((component as any).updateMessages).toHaveBeenCalledWith(
      'Sorry, I am unable to process your request at the moment.',
      ChatType.ASSISTANT
    );
    expect(component.isLoading).toBe(false);
  });

  it('should reload chat list when continuing chat with few messages', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.chatMessagesResource.value.and.returnValue([
      { content: 'First message', type: ChatType.USER }
    ]);
    mockMemoryChatService.continueChat.and.returnValue(of({
      content: 'AI response',
      type: ChatType.ASSISTANT
    }));
    component.userInput.set('test message');

    (component as any).sendChatMessage('test message');

    expect(mockMemoryChatService.chatsResource.reload).toHaveBeenCalled();
  });

  it('should not reload chat list when continuing chat with many messages', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.chatMessagesResource.value.and.returnValue([
      { content: 'First message', type: ChatType.USER },
      { content: 'Second message', type: ChatType.ASSISTANT },
      { content: 'Third message', type: ChatType.USER }
    ]);
    mockMemoryChatService.continueChat.and.returnValue(of({
      content: 'AI response',
      type: ChatType.ASSISTANT
    }));
    component.userInput.set('test message');

    (component as any).sendChatMessage('test message');

    expect(mockMemoryChatService.chatsResource.reload).not.toHaveBeenCalled();
  });

  describe('Input Validation', () => {
    it('should return null validation error for empty input', () => {
      component.userInput.set('');
      fixture.detectChanges();
      expect(component.validationError()).toBeNull();
    });

    it('should return null validation error for whitespace-only input', () => {
      component.userInput.set('   ');
      fixture.detectChanges();
      expect(component.validationError()).toBeNull();
    });

    it('should return null validation error for valid input', () => {
      component.userInput.set('Tell me about your memory');
      fixture.detectChanges();
      expect(component.validationError()).toBeNull();
    });

    it('should return error for message exceeding max length', () => {
      component.userInput.set('a'.repeat(2001));
      fixture.detectChanges();
      const error = component.validationError();
      expect(error).toBeTruthy();
      expect(error).toContain('too long');
      expect(error).toContain('2001/2000');
    });

    it('should return null validation error for message at max length', () => {
      component.userInput.set('a'.repeat(2000));
      fixture.detectChanges();
      expect(component.validationError()).toBeNull();
    });
  });

  describe('canSend()', () => {
    it('should return false for empty input', () => {
      component.userInput.set('');
      component.isLoading = false;
      expect(component.canSend()).toBe(false);
    });

    it('should return false for whitespace-only input', () => {
      component.userInput.set('   ');
      component.isLoading = false;
      expect(component.canSend()).toBe(false);
    });

    it('should return false when loading', () => {
      component.userInput.set('valid message');
      component.isLoading = true;
      expect(component.canSend()).toBe(false);
    });

    it('should return false for message exceeding max length', () => {
      component.userInput.set('a'.repeat(2001));
      component.isLoading = false;
      expect(component.canSend()).toBe(false);
    });

    it('should return true for valid input when not loading', () => {
      component.userInput.set('valid message');
      component.isLoading = false;
      expect(component.canSend()).toBe(true);
    });
  });

  describe('sanitizeInput()', () => {
    it('should remove script tags from input', () => {
      const input = 'Hello <script>alert("xss")</script> world';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('Hello  world');
    });

    it('should remove multiple script tags', () => {
      const input = '<script>alert(1)</script>test<script>alert(2)</script>';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('should remove HTML tags', () => {
      const input = 'Hello <b>world</b> <i>test</i>';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('Hello world test');
    });

    it('should trim the result', () => {
      const input = '  <b>test</b>  ';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('should handle clean input without modifications', () => {
      const input = 'What do you remember about our conversation?';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('What do you remember about our conversation?');
    });
  });

  describe('sendMessage with validation', () => {
    it('should not send message when canSend returns false', () => {
      component.userInput.set('');
      spyOn(component as any, 'sendChatMessage');
      component.sendMessage();
      expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    });

    it('should sanitize input before sending to startNewChat', () => {
      mockMemoryChatService.selectedChatId.and.returnValue(undefined);
      const maliciousInput = 'Test <script>alert("xss")</script> message';
      component.userInput.set(maliciousInput);
      
      const mockResponse: ChatStartResponse = {
        chatId: 'new-chat-789',
        message: 'Response',
        description: 'New chat'
      };
      mockMemoryChatService.startNewChat.and.returnValue(of(mockResponse));
      
      component.sendMessage();
      
      expect(mockMemoryChatService.startNewChat).toHaveBeenCalledWith('Test  message');
    });

    it('should sanitize input before sending to continueChat', () => {
      mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
      const maliciousInput = 'Continue <b>bold</b> <script>hack()</script>';
      component.userInput.set(maliciousInput);
      
      mockMemoryChatService.continueChat.and.returnValue(
        of({ content: 'Response', type: ChatType.ASSISTANT })
      );
      
      component.sendMessage();
      
      expect(mockMemoryChatService.continueChat).toHaveBeenCalledWith('chat-123', 'Continue bold');
    });
  });
});
