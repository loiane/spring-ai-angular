import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { form, FormField, maxLength } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { catchError, of } from 'rxjs';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { MessageType } from '../../models/concierge-message';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-concierge-chat',
  imports: [
    FormField,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatFormFieldModule,
    MatListModule,
    MarkdownToHtmlPipe
],
  templateUrl: './concierge-chat.html',
  styleUrl: './concierge-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConciergeChat {
  private readonly flightService = inject(FlightReservationService);

  protected messages = this.flightService.messages;
  protected selectedReservation = this.flightService.selectedReservation;
  protected currentMessage = signal('');
  protected readonly messageForm = form(this.currentMessage, p => maxLength(p, MAX_MESSAGE_LENGTH));

  protected readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;
  protected MessageType = MessageType;

  // Validation state derived from the signal form
  protected readonly validationError = computed(() => {
    if (this.messageForm().errors().some(error => error.kind === 'maxLength')) {
      return `Message is too long (${this.currentMessage().length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return null;
  });

  protected readonly canSend = computed(() => {
    const input = this.currentMessage().trim();
    return input.length > 0 && this.messageForm().valid();
  });

  protected sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedMessage = this.sanitizeInput(this.currentMessage().trim());
    this.currentMessage.set('');

    // sendConciergeMessageStream synchronously appends the user message, so it
    // must be called before startAssistantMessage() appends the placeholder —
    // otherwise the placeholder ends up before the user message in the list.
    const stream$ = this.flightService.sendConciergeMessageStream(sanitizedMessage);
    this.flightService.startAssistantMessage();

    stream$
      .pipe(
        catchError(error => {
          this.flightService.handleConciergeStreamError(error);
          return of();
        })
      )
      .subscribe({
        next: (delta: string) => this.flightService.appendToLastAssistantMessage(delta),
        complete: () => this.flightService.completeAssistantMessage()
      });
  }

  private sanitizeInput(input: string): string {
    // Remove any potential script tags and sanitize the input
    return input
      .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replaceAll(/<[^>]+>/g, '')
      .trim();
  }

  protected onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  protected formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  }
}
