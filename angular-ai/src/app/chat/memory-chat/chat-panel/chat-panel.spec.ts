import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';

import { ChatPanel } from './chat-panel';
import { MemoryChatService } from '../memory-chat.service';
import { ChatMessage, ChatType } from '../../chat-message';
import { ChatStartResponse } from '../../chat';

class MockMemoryChatService {
  selectedChatId = signal<string | undefined>(undefined);
  messagesStatus = signal('idle');
  messagesValue = signal<ChatMessage[]>([]);
  chatMessagesResource = {
    value: this.messagesValue,
    status: this.messagesStatus,
    error: signal(null),
    reload: vi.fn()
  };
  chatsResource = {
    reload: vi.fn()
  };

  messagesError = signal<unknown>(null);
  messagesErrorHandler = {
    error: this.messagesError,
    retryCount: signal(0),
    reset: vi.fn()
  };

  continueChat = vi.fn().mockReturnValue(of({
    content: 'Response from AI',
    type: ChatType.ASSISTANT
  }));

  startNewChat = vi.fn().mockReturnValue(of({
    chatId: 'new-chat-123',
    message: 'AI response',
    description: 'New chat started'
  }));

  selectChat = vi.fn();
  retryLoadMessages = vi.fn();
}

describe('ChatPanel', () => {
  let component: ChatPanel;
  let fixture: ComponentFixture<ChatPanel>;
  let mockMemoryChatService: MockMemoryChatService;

  beforeEach(async () => {
    mockMemoryChatService = new MockMemoryChatService();

    await TestBed.configureTestingModule({
      imports: [ChatPanel],
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

  function getInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[matInput]');
  }

  function typeMessage(text: string): void {
    const input = getInput();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickSend(): void {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    button.click();
    fixture.detectChanges();
  }

  function getMessageBubbles(): string[] {
    const bubbles = fixture.nativeElement.querySelectorAll('.message-bubble');
    return Array.from(bubbles as NodeListOf<HTMLElement>).map(b => b.textContent?.trim() ?? '');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty chat and empty input', () => {
    expect(getMessageBubbles()).toEqual([]);
    expect(getInput().value).toBe('');
  });

  it('should not render the send button when input is empty', () => {
    expect(fixture.nativeElement.querySelector('button[aria-label="Send"]')).toBeNull();
  });

  it('should not send a whitespace-only message', () => {
    typeMessage('   ');
    getInput().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture.detectChanges();

    expect(mockMemoryChatService.startNewChat).not.toHaveBeenCalled();
    expect(mockMemoryChatService.continueChat).not.toHaveBeenCalled();
  });

  it('should start a new chat when no chat is selected', () => {
    mockMemoryChatService.selectedChatId.set(undefined);

    typeMessage('new chat message');
    clickSend();

    expect(mockMemoryChatService.startNewChat).toHaveBeenCalledWith('new chat message');
    expect(mockMemoryChatService.selectChat).toHaveBeenCalledWith('new-chat-123');
    expect(mockMemoryChatService.chatsResource.reload).toHaveBeenCalled();
    expect(getInput().value).toBe('');
  });

  it('should continue the existing chat when a chat is selected', () => {
    mockMemoryChatService.selectedChatId.set('existing-chat-123');

    typeMessage('continue message');
    clickSend();

    expect(mockMemoryChatService.continueChat).toHaveBeenCalledWith('existing-chat-123', 'continue message');
    const bubbles = getMessageBubbles();
    expect(bubbles).toContain('continue message');
    expect(bubbles[bubbles.length - 1]).toBe('Response from AI');
  });

  it('should show the typing indicator while waiting for the response', () => {
    mockMemoryChatService.selectedChatId.set('chat-123');
    const response$ = new Subject<ChatMessage>();
    mockMemoryChatService.continueChat.mockReturnValue(response$);

    typeMessage('slow message');
    clickSend();

    expect(fixture.nativeElement.querySelector('.typing')).toBeTruthy();

    response$.next({ content: 'Done', type: ChatType.ASSISTANT });
    response$.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.typing')).toBeNull();
    expect(getMessageBubbles()).toContain('Done');
  });

  it('should render an error message when continuing a chat fails', () => {
    mockMemoryChatService.selectedChatId.set('chat-123');
    mockMemoryChatService.continueChat.mockReturnValue(throwError(() => new Error('API Error')));

    typeMessage('failing message');
    clickSend();

    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Sorry, I am unable to process your request at the moment.');
  });

  it('should render an error message when starting a new chat fails', () => {
    mockMemoryChatService.selectedChatId.set(undefined);
    mockMemoryChatService.startNewChat.mockReturnValue(throwError(() => new Error('API Error')));

    typeMessage('failing message');
    clickSend();

    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Sorry, I am unable to process your request at the moment.');
  });

  it('should reload the chat list when continuing a chat with few messages', () => {
    mockMemoryChatService.selectedChatId.set('chat-123');
    mockMemoryChatService.messagesValue.set([
      { content: 'First message', type: ChatType.USER }
    ]);

    typeMessage('test message');
    clickSend();

    expect(mockMemoryChatService.chatsResource.reload).toHaveBeenCalled();
  });

  it('should not reload the chat list when continuing a chat with many messages', () => {
    mockMemoryChatService.selectedChatId.set('chat-123');
    mockMemoryChatService.messagesValue.set([
      { content: 'First message', type: ChatType.USER },
      { content: 'Second message', type: ChatType.ASSISTANT },
      { content: 'Third message', type: ChatType.USER }
    ]);

    typeMessage('test message');
    clickSend();

    expect(mockMemoryChatService.chatsResource.reload).not.toHaveBeenCalled();
  });

  it('should sanitize HTML and script tags before sending to startNewChat', () => {
    mockMemoryChatService.selectedChatId.set(undefined);
    const mockResponse: ChatStartResponse = {
      chatId: 'new-chat-789',
      message: 'Response',
      description: 'New chat'
    };
    mockMemoryChatService.startNewChat.mockReturnValue(of(mockResponse));

    typeMessage('Test <script>alert("xss")</script> message');
    clickSend();

    expect(mockMemoryChatService.startNewChat).toHaveBeenCalledWith('Test  message');
  });

  it('should sanitize HTML and script tags before sending to continueChat', () => {
    mockMemoryChatService.selectedChatId.set('chat-123');

    typeMessage('Continue <b>bold</b> <script>hack()</script>');
    clickSend();

    expect(mockMemoryChatService.continueChat).toHaveBeenCalledWith('chat-123', 'Continue bold');
  });

  it('should show the character counter hint', () => {
    typeMessage('hello');
    const hint: HTMLElement = fixture.nativeElement.querySelector('mat-hint');
    expect(hint.textContent).toContain('5/2000');
  });

  it('should disable send for messages over the max length', () => {
    expect(getInput().getAttribute('maxlength')).toBe('2000');

    typeMessage('a'.repeat(2001));

    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button.disabled).toBe(true);
  });

  it('should not show a validation error at exactly max length', () => {
    typeMessage('a'.repeat(2000));

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button.disabled).toBe(false);
  });

  it('should show the messages error component when loading messages fails', () => {
    mockMemoryChatService.messagesStatus.set('error');
    mockMemoryChatService.messagesError.set({
      error: new Error('load failed'),
      message: 'Failed to load messages',
      retryCount: 0,
      timestamp: new Date(),
      isRetryable: true
    });
    fixture.detectChanges();

    const errorComponent = fixture.nativeElement.querySelector('app-resource-error');
    expect(errorComponent).toBeTruthy();
    expect(errorComponent.textContent).toContain('Error Loading Messages');

    const retryButton: HTMLButtonElement = errorComponent.querySelector('button[aria-label="Retry loading data"]');
    retryButton.click();
    expect(mockMemoryChatService.retryLoadMessages).toHaveBeenCalled();
  });
});
