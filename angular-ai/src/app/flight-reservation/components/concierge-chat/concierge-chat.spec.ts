import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ConciergeChat } from './concierge-chat';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { ConciergeResponse } from '../../models/concierge-message';
import { ReservationStatus } from '../../models/flight-reservation';

describe('ConciergeChat', () => {
  let component: ConciergeChat;
  let fixture: ComponentFixture<ConciergeChat>;
  let service: FlightReservationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConciergeChat],
      providers: [
        FlightReservationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConciergeChat);
    component = fixture.componentInstance;
    service = TestBed.inject(FlightReservationService);
    fixture.detectChanges();
  });

  function getTextarea(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea[matInput]');
  }

  function typeMessage(text: string): void {
    const textarea = getTextarea();
    textarea.value = text;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function getSendButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-label="Send message"]');
  }

  function getMessages(): string[] {
    const messages = fixture.nativeElement.querySelectorAll('.message-content');
    return Array.from(messages as NodeListOf<HTMLElement>).map(m => m.textContent?.trim() ?? '');
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the initial concierge greeting', () => {
    const messages = getMessages();
    expect(messages.length).toBe(1);
    expect(messages[0]).toContain("I'm your SpringFly Concierge");
  });

  it('should start with an empty message input and disabled send button', () => {
    expect(getTextarea().value).toBe('');
    expect(getSendButton().disabled).toBe(true);
  });

  it('should enable the send button when the user types a message', () => {
    typeMessage('I need help');
    expect(getSendButton().disabled).toBe(false);
  });

  it('should keep the send button disabled for whitespace-only input', () => {
    typeMessage('   ');
    expect(getSendButton().disabled).toBe(true);
  });

  it('should show the reservation number in the header when one is selected', () => {
    service.selectedReservation.set({
      number: 'SA101',
      name: 'John Doe',
      date: '2025-10-10',
      status: ReservationStatus.CONFIRMED,
      from: 'New York',
      to: 'London',
      seat: '12A',
      class: 'Economy'
    });
    fixture.detectChanges();

    const subtitle: HTMLElement = fixture.nativeElement.querySelector('mat-card-subtitle');
    expect(subtitle.textContent).toContain('SA101');
  });

  describe('sending messages', () => {
    it('should send the message and render the assistant response', () => {
      const mockResponse: ConciergeResponse = {
        content: 'How can I assist you?',
        requiresAction: false
      };
      vi.spyOn(service, 'sendConciergeMessage').mockReturnValue(of(mockResponse));

      typeMessage('Hello, I need help');
      getSendButton().click();
      fixture.detectChanges();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith('Hello, I need help');
      expect(getMessages()).toContain('How can I assist you?');
      // The input is cleared after sending, so the send button is disabled again
      expect(getSendButton().disabled).toBe(true);
    });

    it('should render an error message when sending fails', () => {
      vi.spyOn(service, 'sendConciergeMessage').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      typeMessage('Test message');
      getSendButton().click();
      fixture.detectChanges();

      const messages = getMessages();
      expect(messages[messages.length - 1]).toContain('having trouble connecting');
    });

    it('should send the message when pressing Enter without Shift', () => {
      vi.spyOn(service, 'sendConciergeMessage').mockReturnValue(
        of({ content: 'OK', requiresAction: false })
      );

      typeMessage('enter message');
      getTextarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false }));
      fixture.detectChanges();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith('enter message');
    });

    it('should not send the message when pressing Enter with Shift', () => {
      vi.spyOn(service, 'sendConciergeMessage');

      typeMessage('multiline message');
      getTextarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
      fixture.detectChanges();

      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });

    it('should not send when pressing other keys', () => {
      vi.spyOn(service, 'sendConciergeMessage');

      typeMessage('message');
      getTextarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      fixture.detectChanges();

      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });

    it('should sanitize HTML and script tags before sending', () => {
      vi.spyOn(service, 'sendConciergeMessage').mockReturnValue(
        of({ content: 'OK', requiresAction: false })
      );

      typeMessage('Book flight <script>alert("xss")</script> to NYC');
      getSendButton().click();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith('Book flight  to NYC');
    });

  });

  describe('validation', () => {
    it('should show the character counter hint', () => {
      typeMessage('hello');
      const hint: HTMLElement = fixture.nativeElement.querySelector('mat-hint');
      expect(hint.textContent).toContain('5/2000');
    });

    it('should disable send for messages over the max length', () => {
      expect(getTextarea().getAttribute('maxlength')).toBe('2000');

      typeMessage('a'.repeat(2001));

      expect(getSendButton().disabled).toBe(true);
    });

    it('should not show a validation error at exactly max length', () => {
      typeMessage('a'.repeat(2000));

      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
      expect(getSendButton().disabled).toBe(false);
    });
  });

  it('should render a timestamp for each message', () => {
    const timestamp: HTMLElement = fixture.nativeElement.querySelector('.timestamp');
    expect(timestamp).toBeTruthy();
    expect(timestamp.textContent?.trim()).not.toBe('');
  });
});
