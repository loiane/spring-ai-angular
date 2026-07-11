import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { form, FormField, maxLength } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TripConciergeService } from './services/trip-concierge.service';
import { TripPlanStage } from './models/trip-plan';

const MAX_MESSAGE_LENGTH = 500;

const STAGE_ORDER: TripPlanStage[] = ['flight', 'itinerary', 'budget', 'docs', 'done'];

const STAGE_LABELS: Record<TripPlanStage, string> = {
  flight: 'Searching flights',
  itinerary: 'Planning itinerary',
  budget: 'Estimating budget',
  docs: 'Checking entry requirements',
  done: 'Done'
};

@Component({
  selector: 'app-trip-concierge',
  imports: [
    DecimalPipe,
    FormField,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './trip-concierge.html',
  styleUrl: './trip-concierge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TripConcierge {
  private readonly tripConciergeService = inject(TripConciergeService);

  protected readonly message = signal('');
  protected readonly messageForm = form(this.message, p => maxLength(p, MAX_MESSAGE_LENGTH));
  protected readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  protected readonly isPlanning = this.tripConciergeService.isPlanning;
  protected readonly latestEvent = this.tripConciergeService.latestEvent;
  protected readonly result = this.tripConciergeService.result;

  protected readonly stages = STAGE_ORDER;

  protected stageLabel(stage: TripPlanStage): string {
    return STAGE_LABELS[stage];
  }

  protected readonly currentStageIndex = computed(() => {
    const event = this.latestEvent();
    if (!event) {
      return -1;
    }
    return STAGE_ORDER.indexOf(event.stage);
  });

  protected readonly canPlan = computed(() => {
    return this.message().trim().length > 0 && this.messageForm().valid() && !this.isPlanning();
  });

  protected planTrip(): void {
    if (!this.canPlan()) {
      return;
    }
    this.tripConciergeService.planTripStream(this.message().trim());
  }

  protected stageStatus(stage: TripPlanStage): 'pending' | 'active' | 'complete' {
    const index = STAGE_ORDER.indexOf(stage);
    const current = this.currentStageIndex();
    if (current < 0) {
      return 'pending';
    }
    if (index < current) {
      return 'complete';
    }
    if (index === current) {
      return this.isPlanning() ? 'active' : 'complete';
    }
    return 'pending';
  }
}
