import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { ChatService } from '../chat-service';
import { SimpleChat } from './simple-chat';

class MockChatService {
  sendChatMessageStream() {
    return of('Mocked response');
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

  it('should display the initial welcome message', () => {
    const bubbles = getMessageBubbles();
    expect(bubbles.length).toBe(1);
    expect(bubbles[0]).toBe('Hello, how can I help you today?');
  });

  it('should not render the send button when input is empty', () => {
    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button).toBeNull();
  });

  it('should render the send button once the user types', () => {
    typeMessage('hello');
    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(false);
  });

  it('should send the message and render the streamed response when clicking send', () => {
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(
      of('Test ', 'response')
    );

    typeMessage('test message');
    clickSend();

    expect(chatService.sendChatMessageStream).toHaveBeenCalledWith('test message');
    const bubbles = getMessageBubbles();
    expect(bubbles).toContain('test message');
    expect(bubbles[bubbles.length - 1]).toBe('Test response');
    expect(getInput().value).toBe('');
  });

  it('should send the message when pressing enter', () => {
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(
      of('Enter response')
    );

    typeMessage('enter message');
    getInput().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture.detectChanges();

    expect(chatService.sendChatMessageStream).toHaveBeenCalledWith('enter message');
    expect(getMessageBubbles()).toContain('Enter response');
  });

  it('should not send a whitespace-only message', () => {
    vi.spyOn(chatService, 'sendChatMessageStream');

    typeMessage('   ');
    getInput().dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    fixture.detectChanges();

    expect(chatService.sendChatMessageStream).not.toHaveBeenCalled();
    expect(getMessageBubbles().length).toBe(1);
  });

  it('should show the typing indicator while waiting for the response', () => {
    const response$ = new Subject<string>();
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(response$);

    typeMessage('slow message');
    clickSend();

    expect(fixture.nativeElement.querySelector('.typing')).toBeTruthy();

    response$.next('Done');
    response$.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.typing')).toBeNull();
    expect(getMessageBubbles()).toContain('Done');
  });

  it('should disable the send button while loading', () => {
    const response$ = new Subject<string>();
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(response$);

    typeMessage('slow message');
    clickSend();

    const button = fixture.nativeElement.querySelector('button[aria-label="Send"]');
    expect(button.disabled).toBe(true);
  });

  it('should render an error message when the service fails', () => {
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(
      throwError(() => new Error('Service error'))
    );

    typeMessage('failing message');
    clickSend();

    const bubbles = getMessageBubbles();
    expect(bubbles[bubbles.length - 1]).toBe('Sorry, I am unable to process your request at the moment.');
    expect(fixture.nativeElement.querySelector('.typing')).toBeNull();
  });

  it('should sanitize HTML and script tags before sending', () => {
    vi.spyOn(chatService, 'sendChatMessageStream').mockReturnValue(
      of('Response')
    );

    typeMessage('Hello <script>alert("xss")</script> <b>world</b>');
    clickSend();

    expect(chatService.sendChatMessageStream).toHaveBeenCalledWith('Hello  world');
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
});
