import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ChatList } from './chat-list';
import { MemoryChatService } from '../memory-chat.service';

class MockMemoryChatService {
  selectedChatId = signal<string | undefined>(undefined);
  chatsStatus = signal('resolved');
  chatsValue = signal<{ id: string; description: string }[]>([
    { id: 'chat1', description: 'First chat' },
    { id: 'chat2', description: 'Second chat' }
  ]);
  chatsResource = {
    value: this.chatsValue,
    status: this.chatsStatus,
    error: signal(null),
    isLoading: signal(false),
    reload: vi.fn()
  };

  chatMessagesResource = {
    value: signal([]),
    status: signal('idle'),
    error: signal(null),
    reload: vi.fn()
  };

  chatsError = signal<unknown>(null);
  chatsErrorHandler = {
    error: this.chatsError,
    retryCount: signal(0),
    reset: vi.fn()
  };

  messagesErrorHandler = {
    error: signal(null),
    retryCount: signal(0),
    reset: vi.fn()
  };

  selectChat = vi.fn();
  clearSelection = vi.fn();
  continueChat = vi.fn().mockReturnValue(of({}));
  startNewChat = vi.fn().mockReturnValue(of({}));
  retryLoadChats = vi.fn();
  retryLoadMessages = vi.fn();
}

describe('ChatList', () => {
  let component: ChatList;
  let fixture: ComponentFixture<ChatList>;
  let mockMemoryChatService: MockMemoryChatService;

  beforeEach(async () => {
    mockMemoryChatService = new MockMemoryChatService();

    await TestBed.configureTestingModule({
      imports: [ChatList],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MemoryChatService, useValue: mockMemoryChatService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getChatItems(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('mat-nav-list mat-list-item'));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render toolbar with title', () => {
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();
    expect(toolbar.textContent).toContain('Chat with Memory');
  });

  it('should render the list of chats', () => {
    const items = getChatItems();
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('First chat');
    expect(items[1].textContent).toContain('Second chat');
  });

  it('should select a chat when clicking a chat item', () => {
    getChatItems()[0].click();
    expect(mockMemoryChatService.selectChat).toHaveBeenCalledWith('chat1');
  });

  it('should clear selection when clicking the new chat button', () => {
    const newChatButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[aria-label="Create new chat"]');
    expect(newChatButton.textContent).toContain('New chat');

    newChatButton.click();

    expect(mockMemoryChatService.clearSelection).toHaveBeenCalled();
  });

  it('should not select the chat when clicking its delete button', () => {
    const deleteButton: HTMLButtonElement = getChatItems()[0].querySelector('button[matlistitemmeta]')!;
    deleteButton.click();
    expect(mockMemoryChatService.selectChat).not.toHaveBeenCalled();
  });

  it('should highlight the selected chat', () => {
    mockMemoryChatService.selectedChatId.set('chat2');
    fixture.detectChanges();

    const items = getChatItems();
    expect(items[0].classList.contains('selected')).toBe(false);
    expect(items[1].classList.contains('selected')).toBe(true);
  });

  it('should show the loading state', () => {
    mockMemoryChatService.chatsStatus.set('loading');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading chats...');
  });

  it('should show the empty state when there are no chats', () => {
    mockMemoryChatService.chatsValue.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No chats available');
  });

  it('should show the error component and retry when loading chats fails', () => {
    mockMemoryChatService.chatsStatus.set('error');
    mockMemoryChatService.chatsError.set({
      error: new Error('load failed'),
      message: 'Failed to load chats',
      retryCount: 0,
      timestamp: new Date(),
      isRetryable: true
    });
    fixture.detectChanges();

    const errorComponent = fixture.nativeElement.querySelector('app-resource-error');
    expect(errorComponent).toBeTruthy();
    expect(errorComponent.textContent).toContain('Error Loading Chats');

    const retryButton: HTMLButtonElement = errorComponent.querySelector('button[aria-label="Retry loading data"]');
    retryButton.click();
    expect(mockMemoryChatService.retryLoadChats).toHaveBeenCalled();
  });
});
