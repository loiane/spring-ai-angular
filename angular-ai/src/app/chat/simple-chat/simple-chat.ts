import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { catchError, of } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { MarkdownToHtmlPipe } from '../../shared/markdown-to-html.pipe';
import { ChatResponse } from '../chat-response';
import { ChatService } from '../chat-service';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-simple-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormField, MatToolbar, MatIconModule, MarkdownToHtmlPipe],
  templateUrl: './simple-chat.html',
  styleUrl: './simple-chat.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleChat {

  private readonly chatHistory = viewChild.required<ElementRef>('chatHistory');

  private readonly chatService = inject(ChatService);
  private readonly logger = inject(LoggingService);

  private readonly local = false;

  protected readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  protected userInput = signal('');
  protected readonly chatForm = form(this.userInput, p => maxLength(p, MAX_MESSAGE_LENGTH));
  protected isLoading = signal(false);

  protected messages = signal<ChatResponse[]>([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

  // Validation state derived from the signal form
  protected readonly validationError = computed(() => {
    if (this.chatForm().errors().some(error => error.kind === 'maxLength')) {
      return `Message is too long (${this.userInput().length}/${MAX_MESSAGE_LENGTH} characters)`;
    }
    return null;
  });

  protected readonly canSend = computed(() => {
    const input = this.userInput().trim();
    return input.length > 0 &&
           this.chatForm().valid() &&
           !this.isLoading();
  });

  // Effect to auto-scroll when messages change
  private readonly autoScrollEffect = effect(() => {
    this.messages(); // Read the signal to track changes
    setTimeout(() => this.scrollToBottom(), 0); // Use setTimeout to ensure DOM is updated
  });

  protected sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedInput = this.sanitizeInput(this.userInput().trim());

    this.updateMessages(sanitizedInput);
    this.isLoading.set(true);

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

  private updateMessages(message: string, isBot = false, streaming = false): void {
    this.messages.update(messages => [...messages, { message, isBot, streaming }]);
  }

  private getResponse(): void {
    setTimeout(() => {
      const response = 'This is a simulated response from the AI model.';
      this.updateMessages(response, true);
      this.isLoading.set(false);
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
    this.updateMessages('', true, true);

    this.chatService.sendChatMessageStream(message)
      .pipe(
        catchError(() => {
          this.appendToLastMessage('Sorry, I am unable to process your request at the moment.', true);
          this.setLastMessageStreaming(false);
          this.isLoading.set(false);
          return of();
        })
      )
      .subscribe({
        next: (delta: string) => this.appendToLastMessage(delta),
        complete: () => {
          this.setLastMessageStreaming(false);
          this.userInput.set('');
          this.isLoading.set(false);
        }
      });
  }

  private appendToLastMessage(delta: string, replace = false): void {
    this.messages.update(messages => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, message: replace ? delta : last.message + delta };
      return [...messages.slice(0, lastIndex), updated];
    });
  }

  private setLastMessageStreaming(streaming: boolean): void {
    this.messages.update(messages => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, streaming };
      return [...messages.slice(0, lastIndex), updated];
    });
  }
}
