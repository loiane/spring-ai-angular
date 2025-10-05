import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ConciergeChat } from './concierge-chat';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { ConciergeResponse } from '../../models/concierge-message';
import { of, throwError } from 'rxjs';

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have access to messages from service', () => {
    expect(component.messages).toBe(service.messages);
  });

  it('should have access to selected reservation from service', () => {
    expect(component.selectedReservation).toBe(service.selectedReservation);
  });

  it('should initialize currentMessage as empty', () => {
    expect(component.currentMessage()).toBe('');
  });

  describe('sendMessage', () => {
    it('should send message when currentMessage is not empty', () => {
      const testMessage = 'Hello, I need help';
      const mockResponse: ConciergeResponse = {
        content: 'How can I assist you?',
        requiresAction: false
      };

      component.currentMessage.set(testMessage);

      spyOn(service, 'sendConciergeMessage').and.returnValue(of(mockResponse));
      spyOn(service, 'handleConciergeResponse');

      component.sendMessage();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith(testMessage);
      expect(service.handleConciergeResponse).toHaveBeenCalledWith(mockResponse);
      expect(component.currentMessage()).toBe('');
    });

    it('should not send message when currentMessage is empty', () => {
      component.currentMessage.set('');

      spyOn(service, 'sendConciergeMessage');

      component.sendMessage();

      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });

    it('should not send message when currentMessage is only whitespace', () => {
      component.currentMessage.set('   ');

      spyOn(service, 'sendConciergeMessage');

      component.sendMessage();

      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });

    it('should handle errors when sending message', () => {
      const testMessage = 'Test message';
      const error = new Error('Network error');

      component.currentMessage.set(testMessage);

      spyOn(service, 'sendConciergeMessage').and.returnValue(throwError(() => error));
      spyOn(service, 'handleConciergeError');

      component.sendMessage();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith(testMessage);
      expect(service.handleConciergeError).toHaveBeenCalledWith(error);
      expect(component.currentMessage()).toBe('');
    });
  });

  describe('onKeyPress', () => {
    it('should send message on Enter key without Shift', () => {
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: false });
      spyOn(event, 'preventDefault');
      spyOn(component, 'sendMessage');

      component.onKeyPress(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.sendMessage).toHaveBeenCalled();
    });

    it('should not send message on Enter key with Shift', () => {
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: true });
      spyOn(component, 'sendMessage');

      component.onKeyPress(event);

      expect(component.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message on other keys', () => {
      const event = new KeyboardEvent('keypress', { key: 'a' });
      spyOn(component, 'sendMessage');

      component.onKeyPress(event);

      expect(component.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp correctly', () => {
      const date = new Date('2025-10-05T14:30:00');
      const formatted = component.formatTimestamp(date);

      // Format may vary by locale, so just check it's a non-empty string
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should handle different times', () => {
      const morning = new Date('2025-10-05T09:15:00');
      const evening = new Date('2025-10-05T20:45:00');

      const morningFormatted = component.formatTimestamp(morning);
      const eveningFormatted = component.formatTimestamp(evening);

      expect(morningFormatted).toBeTruthy();
      expect(eveningFormatted).toBeTruthy();
      expect(morningFormatted).not.toBe(eveningFormatted);
    });
  });

  describe('Input Validation', () => {
    it('should return null validation error for empty input', () => {
      component.currentMessage.set('');
      expect(component.validationError()).toBeNull();
    });

    it('should return null validation error for whitespace-only input', () => {
      component.currentMessage.set('   ');
      expect(component.validationError()).toBeNull();
    });

    it('should return null validation error for valid input', () => {
      component.currentMessage.set('I need to book a flight');
      expect(component.validationError()).toBeNull();
    });

    it('should return error for message exceeding max length', () => {
      component.currentMessage.set('a'.repeat(2001));
      const error = component.validationError();
      expect(error).toBeTruthy();
      expect(error).toContain('too long');
      expect(error).toContain('2001/2000');
    });

    it('should return null validation error for message at max length', () => {
      component.currentMessage.set('a'.repeat(2000));
      expect(component.validationError()).toBeNull();
    });
  });

  describe('canSend()', () => {
    it('should return false for empty input', () => {
      component.currentMessage.set('');
      expect(component.canSend()).toBe(false);
    });

    it('should return false for whitespace-only input', () => {
      component.currentMessage.set('   ');
      expect(component.canSend()).toBe(false);
    });

    it('should return false for message exceeding max length', () => {
      component.currentMessage.set('a'.repeat(2001));
      expect(component.canSend()).toBe(false);
    });

    it('should return true for valid input', () => {
      component.currentMessage.set('valid message');
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

    it('should trim the result', () => {
      const input = '  <b>test</b>  ';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('test');
    });

    it('should handle clean input without modifications', () => {
      const input = 'I need a flight to Paris';
      const result = (component as any).sanitizeInput(input);
      expect(result).toBe('I need a flight to Paris');
    });
  });

  describe('sendMessage with validation', () => {
    it('should not send message when canSend returns false', () => {
      component.currentMessage.set('');
      spyOn(service, 'sendConciergeMessage');
      component.sendMessage();
      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });

    it('should sanitize input before sending', () => {
      const maliciousInput = 'Book flight <script>alert("xss")</script> to NYC';
      component.currentMessage.set(maliciousInput);

      spyOn(service, 'sendConciergeMessage').and.returnValue(
        of({ content: 'OK', requiresAction: false })
      );

      component.sendMessage();

      expect(service.sendConciergeMessage).toHaveBeenCalledWith('Book flight  to NYC');
    });

    it('should respect canSend when using Enter key', () => {
      component.currentMessage.set('a'.repeat(2001)); // Too long
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: false });

      spyOn(event, 'preventDefault');
      spyOn(service, 'sendConciergeMessage');

      component.onKeyPress(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(service.sendConciergeMessage).not.toHaveBeenCalled();
    });
  });
});
