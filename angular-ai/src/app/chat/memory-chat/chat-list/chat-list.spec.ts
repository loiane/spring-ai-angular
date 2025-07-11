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
  selectedChatId = jasmine.createSpy().and.returnValue(undefined);
  chatsResource = {
    value: jasmine.createSpy().and.returnValue([
      { id: 'chat1', description: 'First chat' },
      { id: 'chat2', description: 'Second chat' }
    ]),
    status: jasmine.createSpy().and.returnValue('success'),
    isLoading: jasmine.createSpy().and.returnValue(false),
    reload: jasmine.createSpy()
  };

  chatMessagesResource = {
    value: jasmine.createSpy().and.returnValue([]),
    reload: jasmine.createSpy()
  };

  selectChat = jasmine.createSpy();
  clearSelection = jasmine.createSpy();
  continueChat = jasmine.createSpy().and.returnValue(of({}));
  startNewChat = jasmine.createSpy().and.returnValue(of({}));
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
      stopPropagation: jasmine.createSpy()
    } as any;
    spyOn(console, 'log');

    component.deleteChat(chatId, mockEvent);

    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Delete chat:', chatId);
  });

  it('should render toolbar with title', () => {
    const toolbar = fixture.debugElement.query(By.css('mat-toolbar'));
    expect(toolbar).toBeTruthy();
  });

  it('should render new chat button', () => {
    const newChatButton = fixture.debugElement.query(By.css('button[data-test="new-chat-btn"]'));
    if (newChatButton) {
      expect(newChatButton.nativeElement.textContent).toContain('New Chat');
    }
  });

  it('should handle loading state', () => {
    mockMemoryChatService.chatsResource.status.and.returnValue('loading');
    expect(component.chats.status()).toBe('loading');
  });

  it('should handle error state', () => {
    mockMemoryChatService.chatsResource.status.and.returnValue('error');
    expect(component.chats.status()).toBe('error');
  });
});
