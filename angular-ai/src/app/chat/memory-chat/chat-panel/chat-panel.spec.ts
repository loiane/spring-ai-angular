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
    reload: jasmine.createSpy()
  };
  chatsResource = {
    reload: jasmine.createSpy()
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
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
    expect(component.messages()).toEqual([]);
  });

  it('should trim user message', () => {
    component.userInput = '   hello world   ';
    (component as any).trimUserMessage();
    expect(component.userInput).toBe('hello world');
  });

  it('should not send empty message', () => {
    component.userInput = '   ';
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should not send message when loading', () => {
    component.userInput = 'test message';
    component.isLoading = true;
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
  });

  it('should send message when valid input and not loading', () => {
    component.userInput = 'test message';
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
    component.userInput = 'new chat message';

    (component as any).sendChatMessage();

    expect(mockMemoryChatService.startNewChat).toHaveBeenCalledWith('new chat message');
  });

  it('should continue existing chat when chat selected', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('existing-chat-123');
    component.userInput = 'continue message';

    (component as any).sendChatMessage();

    expect(mockMemoryChatService.continueChat).toHaveBeenCalledWith('existing-chat-123', 'continue message');
  });

  it('should handle continue chat success', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.continueChat.and.returnValue(of({
      content: 'AI response',
      type: ChatType.ASSISTANT
    }));
    spyOn(component as any, 'updateMessages');
    component.userInput = 'test message';

    (component as any).sendChatMessage();

    expect((component as any).updateMessages).toHaveBeenCalledWith('AI response', ChatType.ASSISTANT);
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle continue chat error', () => {
    mockMemoryChatService.selectedChatId.and.returnValue('chat-123');
    mockMemoryChatService.continueChat.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(component as any, 'updateMessages');
    component.userInput = 'test message';

    (component as any).sendChatMessage();

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
    component.userInput = 'start new chat';

    (component as any).sendChatMessage();

    expect(mockMemoryChatService.selectChat).toHaveBeenCalledWith('new-chat-456');
    expect(mockMemoryChatService.chatsResource.reload).toHaveBeenCalled();
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle start new chat error', () => {
    mockMemoryChatService.selectedChatId.and.returnValue(undefined);
    mockMemoryChatService.startNewChat.and.returnValue(throwError(() => new Error('API Error')));
    spyOn(component as any, 'updateMessages');
    component.userInput = 'test message';

    (component as any).sendChatMessage();

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
    component.userInput = 'test message';

    (component as any).sendChatMessage();

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
    component.userInput = 'test message';

    (component as any).sendChatMessage();

    expect(mockMemoryChatService.chatsResource.reload).not.toHaveBeenCalled();
  });
});
