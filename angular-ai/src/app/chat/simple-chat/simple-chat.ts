import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { catchError, of } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { ChatResponse } from '../chat-response';
import { ChatService } from '../chat-service';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-simple-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatToolbar, MatIconModule],
  templateUrl: './simple-chat.html',
  styleUrl: './simple-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleChat {

  private readonly chatHistory = viewChild.required<ElementRef>('chatHistory');

  private readonly chatService = inject(ChatService);
  private readonly logger = inject(LoggingService);

  private readonly local = false;

  readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  userInput = signal('');
  isLoading = false;

  messages = signal<ChatResponse[]>([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

  // Computed validation state
  readonly validationError = computed(() => {
    const input = this.userInput().trim();
    if (input.length === 0) {
      return null; // No error for empty input
    }
    if (input.length > MAX_MESSAGE_LENGTH) {
      return `Message is too long (${input.length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return null;
  });

  readonly canSend = computed(() => {
    const input = this.userInput().trim();
    return input.length > 0 && 
           input.length <= MAX_MESSAGE_LENGTH && 
           !this.isLoading;
  });

  // Effect to auto-scroll when messages change
  private readonly autoScrollEffect = effect(() => {
    this.messages(); // Read the signal to track changes
    setTimeout(() => this.scrollToBottom(), 0); // Use setTimeout to ensure DOM is updated
  });

  sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedInput = this.sanitizeInput(this.userInput().trim());
    
    this.updateMessages(sanitizedInput);
    this.isLoading = true;

    if (this.local) {
      this.simulateResponse();
    } else {
      this.sendChatMessage(sanitizedInput);
    }
  }  private sanitizeInput(input: string): string {
    // Remove any potential script tags and sanitize the input
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  private updateMessages(message: string, isBot = false): void {
    this.messages.update(messages => [...messages, { message, isBot }]);
  }

  private getResponse(): void {
    setTimeout(() => {
      const response = 'This is a simulated response from the AI model.';
      this.updateMessages(response, true);
      this.isLoading = false;
    }, 2000);
  }

  private simulateResponse(): void {
    this.getResponse();
    this.userInput.set('');
  }

  private scrollToBottom(): void {
    try {
      const chatElement = this.chatHistory();
      if (chatElement?.nativeElement) {
        chatElement.nativeElement.scrollTop = chatElement.nativeElement.scrollHeight;
      }
    } catch (err) {
      this.logger.error('Failed to scroll chat history', err);
    }
  }

  private sendChatMessage(message: string): void {
    this.chatService.sendChatMessage(message)
    .pipe(
      catchError(() => {
        this.updateMessages('Sorry, I am unable to process your request at the moment.', true);
        this.isLoading = false;
        return of();
      })
    )
    .subscribe((response: ChatResponse) => {
      if (response) {
        this.updateMessages(response.message, true);
      }
      this.userInput.set('');
      this.isLoading = false;
    });
  }
}
