import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoggingService } from '../../shared/logging.service';
import { ResourceErrorHandler, DEFAULT_RETRY_CONFIG } from '../../shared/resource-error-handler';
import { postSse } from '../../shared/sse-client';
import { ApiFlightReservation, FlightReservation, CancellationRequest, CancellationResponse, ReservationStatus, toFlightReservation } from '../models/flight-reservation';
import { ConciergeMessage, ConciergeResponse, MessageType } from '../models/concierge-message';

@Injectable({
  providedIn: 'root'
})
export class FlightReservationService {

  /**
   * API endpoints for flight reservation operations.
   * Public to allow test files to reference these constants with full type safety.
   */
  public readonly RESERVATIONS_API = '/api/flight-reservations';
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
   * Using httpResource for reactive data fetching of all reservations.
   * The backend returns ApiFlightReservation objects, mapped here to the UI model.
   */
  reservationsResource = httpResource<FlightReservation[]>(() => this.RESERVATIONS_API, {
    parse: raw => (raw as ApiFlightReservation[]).map(toFlightReservation)
  });

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
   * Sends a concierge message and streams the assistant's response as it is generated.
   *
   * Each emission is an incremental text chunk (delta) of the assistant's reply,
   * not the full accumulated answer. Callers are responsible for concatenating
   * chunks as they arrive.
   */
  sendConciergeMessageStream(message: string): Observable<string> {
    // Add user message
    const userMessage: ConciergeMessage = {
      content: message,
      type: MessageType.USER,
      timestamp: new Date()
    };

    this.messages.update(messages => [...messages, userMessage]);

    return postSse<ConciergeResponse>(`${this.CONCIERGE_API}/stream`, { message })
      .pipe(
        filter(event => event.event === 'message'),
        map(event => event.data.content)
      );
  }

  /**
   * Appends a placeholder assistant message that streamed text deltas can be
   * appended to via {@link appendToLastAssistantMessage}.
   */
  startAssistantMessage(): void {
    const assistantMessage: ConciergeMessage = {
      content: '',
      type: MessageType.ASSISTANT,
      timestamp: new Date(),
      streaming: true
    };
    this.messages.update(messages => [...messages, assistantMessage]);
  }

  /**
   * Appends (or replaces) the content of the last assistant message.
   * Used to incrementally render streamed response chunks.
   */
  appendToLastAssistantMessage(delta: string, replace = false): void {
    this.messages.update(messages => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, content: replace ? delta : last.content + delta };
      return [...messages.slice(0, lastIndex), updated];
    });
  }

  /**
   * Marks the last assistant message as no longer streaming, so it can be
   * rendered as complete markdown instead of plain incremental text.
   */
  completeAssistantMessage(): void {
    this.messages.update(messages => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, streaming: false };
      return [...messages.slice(0, lastIndex), updated];
    });
  }

  /**
   * Handles errors when streaming a concierge message, replacing the
   * in-progress assistant placeholder message with an error notice.
   */
  handleConciergeStreamError(error: unknown): void {
    this.logger.error('Error streaming concierge message', error);
    this.appendToLastAssistantMessage(
      'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.', true);
    this.completeAssistantMessage();
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
    return this.http
      .put<ApiFlightReservation>(`${this.RESERVATIONS_API}/${request.reservationNumber}/cancel`, null)
      .pipe(map(reservation => ({
        success: reservation.status === ReservationStatus.CANCELLED,
        message: `Reservation ${reservation.reservationId} has been cancelled.`
      })));
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
