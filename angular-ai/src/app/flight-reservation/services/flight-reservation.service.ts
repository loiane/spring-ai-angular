import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { LoggingService } from '../../shared/logging.service';
import { FlightReservation, CancellationRequest, CancellationResponse } from '../models/flight-reservation';
import { ConciergeMessage, ConciergeResponse, MessageType } from '../models/concierge-message';

@Injectable({
  providedIn: 'root'
})
export class FlightReservationService {

  private readonly RESERVATIONS_API = '/api/reservations';
  private readonly CONCIERGE_API = '/api/concierge';

  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);

  selectedReservation = signal<FlightReservation | null>(null);

  // Using httpResource for reactive data fetching
  reservationsResource = httpResource<FlightReservation[]>(() => this.RESERVATIONS_API);

  // Messages for concierge chat
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
  }

  selectReservation(reservation: FlightReservation) {
    this.selectedReservation.set(reservation);
  }

  sendConciergeMessage(message: string) {
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
  handleConciergeResponse(response: ConciergeResponse) {
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
  handleConciergeError(error: unknown) {
    this.logger.error('Error sending concierge message', error);
    const errorMessage: ConciergeMessage = {
      content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.',
      type: MessageType.ASSISTANT,
      timestamp: new Date()
    };
    this.messages.update(messages => [...messages, errorMessage]);
  }

  cancelReservation(request: CancellationRequest) {
    return this.http.post<CancellationResponse>(`${this.RESERVATIONS_API}/cancel`, request);
  }

  refreshReservations() {
    this.reservationsResource.reload();
  }
}
