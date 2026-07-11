import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { SseClient } from '../../shared/sse-client';
import { TripPlanResult, TripPlanStreamEvent } from '../models/trip-plan';

@Injectable({
  providedIn: 'root'
})
export class TripConciergeService {

  public readonly PLAN_API = '/api/trip/plan';

  private readonly http = inject(HttpClient);
  private readonly sseClient = inject(SseClient);
  private readonly logger = inject(LoggingService);

  /**
   * The most recent staged event received while planning a trip, updated as
   * each specialist agent (flight, itinerary, budget, docs) finishes its work.
   */
  latestEvent = signal<TripPlanStreamEvent | null>(null);

  /**
   * The fully composed result, populated once the "done" stage arrives.
   */
  result = signal<TripPlanResult | null>(null);

  isPlanning = signal(false);

  planTrip(message: string): Observable<TripPlanResult> {
    return this.http.post<TripPlanResult>(this.PLAN_API, { message });
  }

  planTripStream(message: string): void {
    this.latestEvent.set(null);
    this.result.set(null);
    this.isPlanning.set(true);

    this.sseClient.post<TripPlanStreamEvent>(`${this.PLAN_API}/stream`, { message }).subscribe({
      next: event => {
        const stageEvent = event.data;
        this.latestEvent.set(stageEvent);
        if (stageEvent.stage === 'done' && stageEvent.result) {
          this.result.set(stageEvent.result);
        }
      },
      error: error => {
        this.logger.error('Error streaming trip plan', error);
        this.isPlanning.set(false);
      },
      complete: () => this.isPlanning.set(false)
    });
  }
}
