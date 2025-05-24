import { NgClass } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { of, throwError } from 'rxjs';
import { SimpleChat } from './simple-chat';
import { ChatService } from '../chat.service';

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
        { provide: ChatService, useClass: MockChatService }
      ]
    }).compileComponents();

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

  it('should update messages with bot response after sendChatMessage', fakeAsync(() => {
    component.userInput = 'test';
    component.sendMessage();
    tick();
    const lastMessage = component.messages().at(-1);
    expect(lastMessage?.message).toBe('Mocked response');
    expect(lastMessage?.isBot).toBeTrue();
  }));

  it('should handle error in sendChatMessage', fakeAsync(() => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(throwError(() => new Error('Error occurred while sending message')));
    component.userInput = 'test';
    component.sendMessage();
    tick();
    const lastMessage = component.messages().at(-1);
    expect(lastMessage?.message).toBe('Sorry, I am unable to process your request at the moment.');
    expect(lastMessage?.isBot).toBeTrue();
  }));

  it('should simulate response in local mode', fakeAsync(() => {
    (component as any).local = true;
    component.userInput = 'test';
    spyOn(component as any, 'getResponse').and.callThrough();
    component.sendMessage();
    expect((component as any).getResponse).toHaveBeenCalled();
    tick(2000);
    const lastMessage = component.messages().at(-1);
    expect(lastMessage?.message).toBe('This is a simulated response from ChatGPT.');
    expect(lastMessage?.isBot).toBeTrue();
  }));
});
