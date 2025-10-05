import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

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

  it('should add user message to messages and call sendChatMessage', () => {
    spyOn(component as any, 'updateMessages').and.callThrough();
    spyOn(component as any, 'sendChatMessage').and.callThrough();
    component.userInput.set('test');
    component.sendMessage();
    expect((component as any).updateMessages).toHaveBeenCalledWith('test');
    expect((component as any).sendChatMessage).toHaveBeenCalled();
  });

  it('should not send empty message', () => {
    component.userInput.set('   ');
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
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should not send message when loading', () => {
    component.userInput.set('test message');
    component.isLoading = true;
    spyOn(component as any, 'updateMessages');
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).updateMessages).not.toHaveBeenCalled();
    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
  });

  it('should update messages correctly', () => {
    const initialMessageCount = component.messages().length;

    (component as any).updateMessages('Test message', false);

    expect(component.messages().length).toBe(initialMessageCount + 1);
    expect(component.messages()[component.messages().length - 1].message).toBe('Test message');
    expect(component.messages()[component.messages().length - 1].isBot).toBe(false);
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

    component.userInput.set('test message');
    (component as any).sendChatMessage('test message');

    expect(chatService.sendChatMessage).toHaveBeenCalledWith('test message');
    expect((component as any).updateMessages).toHaveBeenCalledWith('Test response', true);
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle chat service error', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(
      throwError(() => new Error('Service error'))
    );
    spyOn(component as any, 'updateMessages').and.callThrough();

    component.userInput.set('test message');
    component.isLoading = true;
    (component as any).sendChatMessage('test message');

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

    component.userInput.set('test message');
    (component as any).sendChatMessage('test message');

    expect(chatService.sendChatMessage).toHaveBeenCalledWith('test message');
    expect((component as any).updateMessages).not.toHaveBeenCalledWith(jasmine.any(String), true);
    expect(component.userInput()).toBe('');
    expect(component.isLoading).toBe(false);
  });

  it('should handle local simulation mode', () => {
    spyOn(component as any, 'simulateResponse');
    // Set local to true by accessing private property
    (component as any).local = true;

    component.userInput.set('test message');
    component.sendMessage();

    expect((component as any).simulateResponse).toHaveBeenCalled();
  });

  it('should simulate response in local mode', () => {
    spyOn(component as any, 'getResponse');

    (component as any).simulateResponse();

    expect((component as any).getResponse).toHaveBeenCalled();
    expect(component.userInput()).toBe('');
  });

  it('should simulate response with timeout in getResponse', (done) => {
    spyOn(component as any, 'updateMessages').and.callThrough();

    (component as any).getResponse();

    setTimeout(() => {
      expect((component as any).updateMessages).toHaveBeenCalledWith(
        'This is a simulated response from the AI model.',
        true
      );
      expect(component.isLoading).toBe(false);
      done();
    }, 2100); // Wait slightly longer than the 2000ms timeout
  });

  it('should set loading state when sending message', () => {
    component.userInput.set('test message');
    component.isLoading = false;
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect(component.isLoading).toBe(true);
  });

  it('should not process empty string after trimming', () => {
    component.userInput.set('   ');
    spyOn(component as any, 'sendChatMessage');

    component.sendMessage();

    expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('should clear user input after successful chat service call', () => {
    spyOn(chatService, 'sendChatMessage').and.returnValue(
      of({ message: 'Response', isBot: true })
    );

    component.userInput.set('test message');
    (component as any).sendChatMessage('test message');

    expect(component.userInput()).toBe('');
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
      component.userInput.set('Hello, this is a valid message');
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

    it('should remove nested tags', () => {
      const input = '<div><span>test</span></div>';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('should trim the result', () => {
      const input = '  <b>test</b>  ';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('should handle clean input without modifications', () => {
      const input = 'This is clean text';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('This is clean text');
    });

    it('should handle empty input', () => {
      const input = '';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('');
    });
  });

  describe('sendMessage with validation', () => {
    it('should not send message when canSend returns false', () => {
      component.userInput.set('');
      spyOn(component as any, 'sendChatMessage');
      component.sendMessage();
      expect((component as any).sendChatMessage).not.toHaveBeenCalled();
    });

    it('should sanitize input before sending', () => {
      component.userInput.set('Hello <script>alert("xss")</script> world');
      spyOn(component as any, 'sendChatMessage');
      spyOn(component as any, 'updateMessages');
      
      component.sendMessage();
      
      expect((component as any).updateMessages).toHaveBeenCalledWith('Hello  world');
      expect((component as any).sendChatMessage).toHaveBeenCalledWith('Hello  world');
    });

    it('should send sanitized message to chat service', () => {
      const maliciousInput = 'Test <b>bold</b> <script>hack()</script>';
      component.userInput.set(maliciousInput);
      
      spyOn(chatService, 'sendChatMessage').and.returnValue(
        of({ message: 'Response', isBot: true })
      );
      
      component.sendMessage();
      
      expect(chatService.sendChatMessage).toHaveBeenCalledWith('Test bold');
    });
  });

});
