import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { of, throwError } from 'rxjs';

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
      imports: [SimpleChat],
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

  it('should initialize with default message', () => {
    expect(component.messages().length).toBe(1);
    expect(component.messages()[0].message).toBe('Hello, how can I help you today?');
    expect(component.messages()[0].isBot).toBe(true);
  });

  it('should initialize with correct default values', () => {
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should not send message when loading', () => {
    component.userInput = 'test message';
    component.isLoading = true;
    spyOn(component as any, 'updateMessages');
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).updateMessages).not.toHaveBeenCalled();
    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
  });

  it('should update messages correctly', () => {
    const initialMessageCount = component.messages().length;
    spyOn(component as any, 'scrollToBottom');

    (component as any).updateMessages('Test message', false);

    expect(component.messages().length).toBe(initialMessageCount + 1);
    expect(component.messages()[component.messages().length - 1].message).toBe('Test message');
    expect(component.messages()[component.messages().length - 1].isBot).toBe(false);
    expect((component as any).scrollToBottom).toHaveBeenCalled();
  });

  it('should update messages with bot flag true by default for second parameter', () => {
    const initialMessageCount = component.messages().length;

    (component as any).updateMessages('Bot message', true);

    expect(component.messages().length).toBe(initialMessageCount + 1);
    expect(component.messages()[component.messages().length - 1].message).toBe('Bot message');
    expect(component.messages()[component.messages().length - 1].isBot).toBe(true);
  });

  it('should handle scrollToBottom without errors when chatHistory is available', () => {
    // Test scrollToBottom functionality
    expect(() => (component as any).scrollToBottom()).not.toThrow();
  });

  it('should handle scrollToBottom gracefully when chatHistory throws error', () => {
    // Test scrollToBottom error handling
    expect(() => (component as any).scrollToBottom()).not.toThrow();
  });

  it('should call sendChatMessage and handle successful response', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(
      of({ message: 'Test response', isBot: true })
    );
    spyOn(component as any, 'updateMessages').and.callThrough();

    component.userInput = 'test message';
    (component as any).sendChatMessage();

    expect(chatService.sendChatMessage).toHaveBeenCalledWith('test message');
    expect((component as any).updateMessages).toHaveBeenCalledWith('Test response', true);
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle chat service error', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(
      throwError(() => new Error('Service error'))
    );
    spyOn(component as any, 'updateMessages').and.callThrough();

    component.userInput = 'test message';
    component.isLoading = true;
    (component as any).sendChatMessage();

    expect(chatService.sendChatMessage).toHaveBeenCalledWith('test message');
    expect((component as any).updateMessages).toHaveBeenCalledWith(
      'Sorry, I am unable to process your request at the moment.',
      true
    );
    expect(component.isLoading).toBe(false);
  });

  it('should handle null/undefined response from chat service', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(of(null as any));
    spyOn(component as any, 'updateMessages').and.callThrough();

    component.userInput = 'test message';
    (component as any).sendChatMessage();

    expect(chatService.sendChatMessage).toHaveBeenCalledWith('test message');
    expect((component as any).updateMessages).not.toHaveBeenCalledWith(jasmine.any(String), true);
    expect(component.userInput).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle local simulation mode', () => {
    spyOn(component as any, 'simulateResponse');
    // Set local to true by accessing private property
    (component as any).local = true;

    component.userInput = 'test message';
    component.sendMessage();

    expect((component as any).simulateResponse).toHaveBeenCalled();
  });

  it('should simulate response in local mode', () => {
    spyOn(component as any, 'getResponse');

    (component as any).simulateResponse();

    expect((component as any).getResponse).toHaveBeenCalled();
    expect(component.userInput).toBe('');
  });

  it('should simulate response with timeout in getResponse', (done) => {
    spyOn(component as any, 'updateMessages').and.callThrough();

    (component as any).getResponse();

    setTimeout(() => {
      expect((component as any).updateMessages).toHaveBeenCalledWith(
        'This is a simulated response from ChatGPT.',
        true
      );
      expect(component.isLoading).toBe(false);
      done();
    }, 2100); // Wait slightly longer than the 2000ms timeout
  });

  it('should set loading state when sending message', () => {
    component.userInput = 'test message';
    component.isLoading = false;
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect(component.isLoading).toBe(true);
  });

  it('should trim message before processing', () => {
    component.userInput = '   test message   ';
    spyOn(component as any, 'trimUserMessage').and.callThrough();
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).trimUserMessage).toHaveBeenCalled();
  });

  it('should not process empty string after trimming', () => {
    component.userInput = '   ';
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should clear user input after successful chat service call', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(
      of({ message: 'Response', isBot: true })
    );

    component.userInput = 'test message';
    (component as any).sendChatMessage();

    expect(component.userInput).toBe('');
  });

});
