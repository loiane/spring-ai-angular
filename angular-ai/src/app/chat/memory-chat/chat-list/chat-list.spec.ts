import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ChatList } from './chat-list';
import { MemoryChatService } from '../memory-chat.service';

class MockMemoryChatService {
  selectedChatId = vi.fn().mockReturnValue(undefined);
  chatsResource = {
    value: vi.fn().mockReturnValue([
      { id: 'chat1', description: 'First chat' },
      { id: 'chat2', description: 'Second chat' }
    ]),
    status: vi.fn().mockReturnValue('resolved'),
    error: vi.fn().mockReturnValue(null),
    isLoading: vi.fn().mockReturnValue(false),
    reload: vi.fn()
  };

  chatMessagesResource = {
    value: vi.fn().mockReturnValue([]),
    status: vi.fn().mockReturnValue('idle'),
    error: vi.fn().mockReturnValue(null),
    reload: vi.fn()
  };

  chatsErrorHandler = {
    error: vi.fn().mockReturnValue(null),
    retryCount: vi.fn().mockReturnValue(0),
    reset: vi.fn()
  };

  messagesErrorHandler = {
    error: vi.fn().mockReturnValue(null),
    retryCount: vi.fn().mockReturnValue(0),
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
      imports: [
        ChatList,
        MatSidenavModule,
        MatCardModule,
        MatToolbarModule,
        MatListModule,
        MatIconModule,
        MatButtonModule
      ],
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });  it('should have chats resource initialized', () => {
    expect(component.chats).toBeDefined();
  });

  it('should have memoryChatService injected', () => {
    expect(component.memoryChatService).toBeDefined();
  });

  it('should select chat when selectChat is called', () => {
    const chatId = 'test-chat-id';
    component.selectChat(chatId);
    expect(mockMemoryChatService.selectChat).toHaveBeenCalledWith(chatId);
  });

  it('should clear selection when createNewChat is called', () => {
    component.createNewChat();
    expect(mockMemoryChatService.clearSelection).toHaveBeenCalled();
  });

  it('should call deleteChat and stop propagation', () => {
    const chatId = 'test-chat-id';
    const mockEvent = {
      stopPropagation: vi.fn()
    } as any;

    component.deleteChat(chatId, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should render toolbar with title', () => {
    const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
    expect(toolbar).toBeTruthy();
  });

  it('should render new chat button', () => {
    const newChatButton = fixture.debugElement.query(By.css('button[aria-label="Create new chat"]'));
    expect(newChatButton).toBeTruthy();
    expect(newChatButton.nativeElement.textContent).toContain('New chat');
  });

  it('should handle loading state', () => {
    mockMemoryChatService.chatsResource.status.mockReturnValue('loading');
    expect(component.chats.status()).toBe('loading');
  });

  it('should handle error state', () => {
    mockMemoryChatService.chatsResource.status.mockReturnValue('error');
    expect(component.chats.status()).toBe('error');
  });
});
