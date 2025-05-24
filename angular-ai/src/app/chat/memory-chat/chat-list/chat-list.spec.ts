import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ChatList } from './chat-list';

describe('ChatList', () => {
  let component: ChatList;
  let fixture: ComponentFixture<ChatList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatList],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have chats resource initialized', () => {
    expect(component.chats).toBeDefined();
  });

  it('should have selectedChatId signal initialized to null', () => {
    expect(component.selectedChatId()).toBeNull();
  });

  it('should select chat when selectChat is called', () => {
    const chatId = 'test-chat-id';
    component.selectChat(chatId);
    expect(component.selectedChatId()).toBe(chatId);
  });
});
