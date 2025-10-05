import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { ResourceErrorHandler, DEFAULT_RETRY_CONFIG } from '../../shared/resource-error-handler';
import { FlightReservation, CancellationRequest, CancellationResponse } from '../models/flight-reservation';
import { ConciergeMessage, ConciergeResponse, MessageType } from '../models/concierge-message';

@Injectable({
  providedIn: 'root'
})
export class FlightReservationService {

  /**
   * API endpoints for flight reservation operations.
   * Public to allow test files to reference these constants with full type safety.
   */
  public readonly RESERVATIONS_API = '/api/reservations';
  public readonly CONCIERGE_API = '/api/concierge';

  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);

  /**
   * Error handler for reservations resource with retry logic
   */
  readonly reservationsErrorHandler = new ResourceErrorHandler(DEFAULT_RETRY_CONFIG);

  /**
   * The currently selected flight reservation.
   *
   * @remarks
   * When a user selects a reservation from the list, this signal is updated.
   * The concierge chat can use this information to provide context-aware assistance.
   */
  selectedReservation = signal<FlightReservation | null>(null);

  /**
   * Using httpResource for reactive data fetching of all reservations
   */
  reservationsResource = httpResource<FlightReservation[]>(() => this.RESERVATIONS_API);

  /**
   * Messages for concierge chat with initial greeting
   */
  messages = signal<ConciergeMessage[]>([
    {
      content: 'Hello! I\'m your SpringFly Concierge. How can I assist you with your booking today?',
      type: MessageType.ASSISTANT,
      timestamp: new Date()
    }
  ]);

  constructor() {
    // Effect to log selected reservation changes
    effect(() => {
      const selected = this.selectedReservation();
      if (selected) {
        this.logger.debug('Selected reservation', selected.number);
      }
    });

    // Effect to monitor resource errors and trigger error handler
    effect(() => {
      const status = this.reservationsResource.status();
      const error = this.reservationsResource.error();

      if (status === 'error' && error) {
        this.logger.error('Error loading reservations', error);
        this.reservationsErrorHandler.handleError(error);
      } else if (status === 'resolved') {
        // Clear errors on successful load
        this.reservationsErrorHandler.reset();
      }
    });
  }

  selectReservation(reservation: FlightReservation): void {
    this.selectedReservation.set(reservation);
  }

  sendConciergeMessage(message: string): Observable<ConciergeResponse> {
    // Add user message
    const userMessage: ConciergeMessage = {
      content: message,
      type: MessageType.USER,
      timestamp: new Date()
    };

    this.messages.update(messages => [...messages, userMessage]);

    // Return Observable for caller to handle subscription
    return this.http.post<ConciergeResponse>(this.CONCIERGE_API, { message });
  }

  /**
   * Handles the response from sending a concierge message
   */
  handleConciergeResponse(response: ConciergeResponse): void {
    const assistantMessage: ConciergeMessage = {
      content: response.content,
      type: MessageType.ASSISTANT,
      timestamp: new Date()
    };
    this.messages.update(messages => [...messages, assistantMessage]);
  }

  /**
   * Handles errors when sending a concierge message
   */
  handleConciergeError(error: unknown): void {
    this.logger.error('Error sending concierge message', error);
    const errorMessage: ConciergeMessage = {
      content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
      type: MessageType.ASSISTANT,
      timestamp: new Date()
    };
    this.messages.update(messages => [...messages, errorMessage]);
  }

  cancelReservation(request: CancellationRequest): Observable<CancellationResponse> {
    return this.http.post<CancellationResponse>(`${this.RESERVATIONS_API}/cancel`, request);
  }

  refreshReservations(): void {
    this.reservationsResource.reload();
  }

  /**
   * Retry loading reservations using error handler's retry logic
   */
  retryLoadReservations(): void {
    this.reservationsErrorHandler.retry(() => {
      this.refreshReservations();
    });
  }
}
