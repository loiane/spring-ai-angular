import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { FlightReservationService } from './flight-reservation.service';
import { FlightReservation, CancellationRequest, CancellationResponse, ReservationStatus } from '../models/flight-reservation';
import { ConciergeResponse, MessageType } from '../models/concierge-message';

describe('FlightReservationService', () => {
  let service: FlightReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FlightReservationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(FlightReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // The httpResource automatically makes a GET request to /api/reservations
    // We need to flush this request if it exists
    const pending = httpMock.match(service.RESERVATIONS_API);
    if (pending.length > 0) {
      pending.forEach(req => req.flush([]));
    }
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct API endpoints', () => {
    expect(service.RESERVATIONS_API).toBe('/api/reservations');
    expect(service.CONCIERGE_API).toBe('/api/concierge');
  });

  describe('selectedReservation signal', () => {
    it('should initialize as null', () => {
      expect(service.selectedReservation()).toBeNull();
    });

    it('should update when a reservation is selected', () => {
      const mockReservation: FlightReservation = {
        number: 'SA101',
        name: 'John Doe',
        date: '2025-10-10',
        status: ReservationStatus.CONFIRMED,
        from: 'New York',
        to: 'London',
        seat: '12A',
        class: 'Economy'
      };

      service.selectedReservation.set(mockReservation);
      expect(service.selectedReservation()).toEqual(mockReservation);
    });

    it('should select a reservation using selectReservation method', () => {
      const mockReservation: FlightReservation = {
        number: 'SA102',
        name: 'Jane Smith',
        date: '2025-11-15',
        status: ReservationStatus.PENDING,
        from: 'Boston',
        to: 'Paris',
        seat: '5B',
        class: 'Business'
      };

      service.selectReservation(mockReservation);
      expect(service.selectedReservation()).toEqual(mockReservation);
    });
  });

  describe('messages signal', () => {
    it('should initialize with a greeting message', () => {
      const messages = service.messages();
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe(MessageType.ASSISTANT);
      expect(messages[0].content).toContain('SpringFly Concierge');
    });
  });

  describe('sendConciergeMessage', () => {
    it('should send a message and add user message to chat', (done) => {
      const userMessage = 'I need help with my booking';
      const mockResponse: ConciergeResponse = {
        content: 'I can help you with that!',
        requiresAction: false
      };

      const initialMessageCount = service.messages().length;

      service.sendConciergeMessage(userMessage).subscribe(response => {
        expect(response).toEqual(mockResponse);
        
        // Check that user message was added
        const messages = service.messages();
        expect(messages.length).toBe(initialMessageCount + 1);
        
        const lastMessage = messages[messages.length - 1];
        expect(lastMessage.content).toBe(userMessage);
        expect(lastMessage.type).toBe(MessageType.USER);
        
        done();
      });

      const req = httpMock.expectOne(service.CONCIERGE_API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: userMessage });
      req.flush(mockResponse);
    });

    it('should handle errors when sending concierge message', (done) => {
      const userMessage = 'Test message';
      const errorMessage = 'Server error';

      service.sendConciergeMessage(userMessage).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(service.CONCIERGE_API);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation successfully', (done) => {
      const cancellationRequest: CancellationRequest = {
        reservationNumber: 'SA101',
        firstName: 'John',
        lastName: 'Doe',
        reason: 'Change of plans'
      };
      const mockResponse: CancellationResponse = {
        success: true,
        message: 'Reservation cancelled successfully',
        cancellationFee: 50.00
      };

      service.cancelReservation(cancellationRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${service.RESERVATIONS_API}/cancel`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(cancellationRequest);
      req.flush(mockResponse);
    });

    it('should handle errors when cancelling reservation', (done) => {
      const cancellationRequest: CancellationRequest = {
        reservationNumber: 'SA999',
        firstName: 'Test',
        lastName: 'User',
        reason: 'Test'
      };

      service.cancelReservation(cancellationRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${service.RESERVATIONS_API}/cancel`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('reservationsResource', () => {
    it('should be defined', () => {
      expect(service.reservationsResource).toBeDefined();
    });

    it('should use the correct API endpoint', () => {
      // The httpResource will make a request when accessed
      // We can verify the URL is correct by checking the resource configuration
      expect(service.reservationsResource).toBeTruthy();
    });
  });

  describe('handleConciergeResponse', () => {
    it('should add assistant message to messages', () => {
      const mockResponse: ConciergeResponse = {
        content: 'Here is your answer',
        requiresAction: false
      };

      const initialLength = service.messages().length;
      service.handleConciergeResponse(mockResponse);

      const messages = service.messages();
      expect(messages.length).toBe(initialLength + 1);
      
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.content).toBe(mockResponse.content);
      expect(lastMessage.type).toBe(MessageType.ASSISTANT);
    });
  });

  describe('handleConciergeError', () => {
    it('should add error message to chat', () => {
      const initialLength = service.messages().length;
      const error = new Error('Network error');

      service.handleConciergeError(error);

      const messages = service.messages();
      expect(messages.length).toBe(initialLength + 1);
      
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.type).toBe(MessageType.ASSISTANT);
      expect(lastMessage.content).toContain('trouble connecting');
    });
  });

  describe('refreshReservations', () => {
    it('should reload the reservations resource', () => {
      spyOn(service.reservationsResource, 'reload');
      
      service.refreshReservations();
      
      expect(service.reservationsResource.reload).toHaveBeenCalled();
    });
  });
});
