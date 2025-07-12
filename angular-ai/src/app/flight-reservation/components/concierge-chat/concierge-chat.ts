import { Component, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-concierge-chat',
  standalone: true,
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
  styleUrl: './concierge-chat.scss'
})
export class ConciergeChatComponent {
  private readonly flightService = inject(FlightReservationService);

  messages = this.flightService.messages;
  selectedReservation = this.flightService.selectedReservation;
  currentMessage = signal('');

  MessageType = MessageType;

  sendMessage() {
    const message = this.currentMessage();
    if (message.trim()) {
      this.flightService.sendConciergeMessage(message);
      this.currentMessage.set('');
    }
  }

  onKeyPress(event: KeyboardEvent) {
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
