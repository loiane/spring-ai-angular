import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TripConciergeService } from './trip-concierge.service';
import { TripPlanResult } from '../models/trip-plan';

describe('TripConciergeService', () => {
  let service: TripConciergeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TripConciergeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(TripConciergeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have the correct API endpoint', () => {
    expect(service.PLAN_API).toBe('/api/trip/plan');
  });

  describe('initial state', () => {
    it('should start with no event, no result, and not planning', () => {
      expect(service.latestEvent()).toBeNull();
      expect(service.result()).toBeNull();
      expect(service.isPlanning()).toBe(false);
    });
  });

  describe('planTrip', () => {
    it('should POST the message and return the composed result', async () => {
      const message = 'Plan a trip to Lisbon';
      const mockResult: TripPlanResult = {
        request: {
          origin: 'NYC', destination: 'Lisbon', startDate: '2026-09-01', endDate: '2026-09-06',
          budget: 2000, budgetCurrency: 'USD', travelers: 2, interests: 'museums'
        },
        selectedFlight: null,
        itinerary: [],
        budget: null,
        docsNotes: '',
        summary: 'No flight options found.'
      };

      const responsePromise = firstValueFrom(service.planTrip(message));

      const req = httpMock.expectOne(service.PLAN_API);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message });
      req.flush(mockResult);

      const response = await responsePromise;
      expect(response).toEqual(mockResult);
    });
  });

  describe('planTripStream', () => {
    it('should update latestEvent for each staged event and result on "done"', () => {
      service.planTripStream('Plan a trip to Lisbon');

      expect(service.isPlanning()).toBe(true);

      const req = httpMock.expectOne(`${service.PLAN_API}/stream`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: 'Plan a trip to Lisbon' });

      const flightEvent = {
        stage: 'flight',
        flight: { airline: 'SpringFly', flightNumber: 'SF123', origin: 'NYC', destination: 'Lisbon',
          departureDate: '2026-09-01', departureTime: '10:00', arrivalTime: '22:00', price: 300, currency: 'USD' },
        itinerary: null, budget: null, docsNotes: null, result: null
      };
      const doneResult: TripPlanResult = {
        request: { origin: 'NYC', destination: 'Lisbon', startDate: '2026-09-01', endDate: '2026-09-06',
          budget: 2000, budgetCurrency: 'USD', travelers: 2, interests: 'museums' },
        selectedFlight: flightEvent.flight,
        itinerary: [],
        budget: null,
        docsNotes: 'No visa required.',
        summary: 'SpringFly SF123'
      };
      const doneEvent = { stage: 'done', flight: null, itinerary: null, budget: null, docsNotes: null, result: doneResult };

      req.flush(
        `data: ${JSON.stringify(flightEvent)}\n\n`
        + `data: ${JSON.stringify(doneEvent)}\n\n`
      );

      expect(service.latestEvent()).toEqual(doneEvent);
      expect(service.result()).toEqual(doneResult);
      expect(service.isPlanning()).toBe(false);
    });

    it('should reset state on error and stop planning', () => {
      service.planTripStream('Plan a trip');

      const req = httpMock.expectOne(`${service.PLAN_API}/stream`);
      req.error(new ProgressEvent('error'));

      expect(service.isPlanning()).toBe(false);
    });
  });
});
