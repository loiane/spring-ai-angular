import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { of } from 'rxjs';

import { NgClass } from '@angular/common';
import { ChatService } from '../chat-service';
import { SimpleChat } from './simple-chat';

class MockChatService {
  sendChatMessage(message: string) {
    return of({ message: 'Mocked response', isBot: true });
  }
}

describe('SimpleChat', () => {
  let component: SimpleChat;
  let fixture: ComponentFixture<SimpleChat>;
  let chatService: ChatService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatToolbar,
        NgClass,
        MatIconModule
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ChatService, useClass: MockChatService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleChat);
    component = fixture.componentInstance;
    chatService = TestBed.inject(ChatService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should trim user message', () => {
    component.userInput = '   hello   ';
    // @ts-ignore: access private method for test
    component.trimUserMessage();
    expect(component.userInput).toBe('hello');
  });

  it('should add user message to messages and call sendChatMessage', () => {
    spyOn(component as any, 'updateMessages').and.callThrough();
    spyOn(component as any, 'sendChatMessage').and.callThrough();
    component.userInput = 'test';
    component.sendMessage();
    expect((component as any).updateMessages).toHaveBeenCalledWith('test');
    expect((component as any).sendChatMessage).toHaveBeenCalled();
  });

  it('should not send empty message', () => {
    component.userInput = '   ';
    spyOn(component as any, 'updateMessages');
    component.sendMessage();
    expect((component as any).updateMessages).not.toHaveBeenCalled();
  });

});
