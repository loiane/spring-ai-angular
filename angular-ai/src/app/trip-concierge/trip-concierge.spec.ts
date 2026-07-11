import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { TripConcierge } from './trip-concierge';
import { TripConciergeService } from './services/trip-concierge.service';
import { TripPlanResult, TripPlanStreamEvent } from './models/trip-plan';

describe('TripConcierge', () => {
  let component: TripConcierge;
  let fixture: ComponentFixture<TripConcierge>;
  let service: TripConciergeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripConcierge],
      providers: [
        TripConciergeService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripConcierge);
    component = fixture.componentInstance;
    service = TestBed.inject(TripConciergeService);
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

  function getPlanButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-label="Plan trip"]');
  }

  const sampleFlight = {
    airline: 'SpringFly', flightNumber: 'SF123', origin: 'NYC', destination: 'Lisbon',
    departureDate: '2026-09-01', departureTime: '10:00', arrivalTime: '22:00', price: 300, currency: 'USD'
  };

  const sampleResult: TripPlanResult = {
    request: {
      origin: 'NYC', destination: 'Lisbon', startDate: '2026-09-01', endDate: '2026-09-06',
      budget: 2000, budgetCurrency: 'USD', travelers: 2, interests: 'museums'
    },
    selectedFlight: sampleFlight,
    itinerary: [{ date: '2026-09-01', weatherSummary: 'Sunny', suggestedActivities: 'Visit a museum' }],
    budget: {
      currency: 'USD', flightCost: 300, lodgingEstimate: 800, activitiesEstimate: 400,
      foodEstimate: 300, remaining: 200, notes: 'Within budget'
    },
    docsNotes: 'No visa required for US citizens.',
    summary: 'SpringFly SF123 from NYC to Lisbon'
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty message input and disabled plan button', () => {
    expect(getTextarea().value).toBe('');
    expect(getPlanButton().disabled).toBe(true);
  });

  it('should enable the plan button when the user types a message', () => {
    typeMessage('Plan a trip to Lisbon');
    expect(getPlanButton().disabled).toBe(false);
  });

  it('should keep the plan button disabled for whitespace-only input', () => {
    typeMessage('   ');
    expect(getPlanButton().disabled).toBe(true);
  });

  it('should not render the progress stepper before planning starts', () => {
    expect(fixture.nativeElement.querySelector('.progress-card')).toBeNull();
  });

  it('should not render result cards before a result is available', () => {
    expect(fixture.nativeElement.querySelector('.results')).toBeNull();
  });

  describe('planning a trip', () => {
    it('should call planTripStream with the trimmed message', () => {
      vi.spyOn(service, 'planTripStream');

      typeMessage('  Plan a trip to Lisbon  ');
      getPlanButton().click();

      expect(service.planTripStream).toHaveBeenCalledWith('Plan a trip to Lisbon');
    });

    it('should not plan when the button is disabled', () => {
      vi.spyOn(service, 'planTripStream');

      getPlanButton().click();

      expect(service.planTripStream).not.toHaveBeenCalled();
    });

    it('should render the progress stepper once a staged event arrives', () => {
      const flightEvent: TripPlanStreamEvent = {
        stage: 'flight', flight: sampleFlight, itinerary: null, budget: null, docsNotes: null, result: null
      };
      service.latestEvent.set(flightEvent);
      fixture.detectChanges();

      const stages = fixture.nativeElement.querySelectorAll('.stage');
      expect(stages.length).toBe(5);
    });

    it('should mark the current stage active while planning and prior stages complete', () => {
      service.isPlanning.set(true);
      service.latestEvent.set({
        stage: 'budget', flight: sampleFlight, itinerary: [], budget: null, docsNotes: null, result: null
      });
      fixture.detectChanges();

      expect(component['stageStatus']('flight')).toBe('complete');
      expect(component['stageStatus']('itinerary')).toBe('complete');
      expect(component['stageStatus']('budget')).toBe('active');
      expect(component['stageStatus']('docs')).toBe('pending');
    });

    it('should render result cards once the result is available', () => {
      service.result.set(sampleResult);
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('SpringFly SF123');
      expect(text).toContain('Visit a museum');
      expect(text).toContain('Within budget');
      expect(text).toContain('No visa required for US citizens.');
    });

    it('should not render a flight card when no flight was found', () => {
      service.result.set({ ...sampleResult, selectedFlight: null });
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).not.toContain('SpringFly SF123');
      expect(text).toContain('Visit a museum');
    });
  });
});
