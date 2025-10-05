import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { MessageType } from '../../models/concierge-message';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-concierge-chat',
  imports: [
    CommonModule,
    FormsModule,
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

  messages = this.flightService.messages;
  selectedReservation = this.flightService.selectedReservation;
  currentMessage = signal('');

  readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;
  MessageType = MessageType;

  // Computed validation state
  readonly validationError = computed(() => {
    const input = this.currentMessage().trim();
    if (input.length === 0) {
      return null; // No error for empty input
    }
    if (input.length > MAX_MESSAGE_LENGTH) {
      return `Message is too long (${input.length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return null;
  });

  readonly canSend = computed(() => {
    const input = this.currentMessage().trim();
    return input.length > 0 && input.length <= MAX_MESSAGE_LENGTH;
  });

  sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedMessage = this.sanitizeInput(this.currentMessage().trim());
    this.flightService.sendConciergeMessage(sanitizedMessage).subscribe({
      next: (response) => this.flightService.handleConciergeResponse(response),
      error: (error) => this.flightService.handleConciergeError(error)
    });
    this.currentMessage.set('');
  }

  private sanitizeInput(input: string): string {
    // Remove any potential script tags and sanitize the input
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  }
}
