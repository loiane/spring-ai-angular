import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { LoggingService } from '../../../shared/logging.service';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';
import { ResourceErrorComponent } from '../../../shared/resource-error';
import { ChatStartResponse } from '../../chat';
import { ChatMessage, ChatType } from '../../chat-message';
import { MemoryChatService } from '../memory-chat.service';

const MAX_MESSAGE_LENGTH = 2000;

@Component({
  selector: 'app-chat-panel',
  imports: [
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MarkdownToHtmlPipe,
    ResourceErrorComponent
  ],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatPanel {

  private readonly chatHistory = viewChild.required<ElementRef>('chatHistory');

  private readonly memoryChatService = inject(MemoryChatService);
  private readonly logger = inject(LoggingService);

  // Export ChatType for template usage
  protected readonly ChatType = ChatType;
  readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  userInput = signal('');
  isLoading = false;

  messages = signal<ChatMessage[]>([]);
  messagesResource = this.memoryChatService.chatMessagesResource;
  messagesErrorHandler = this.memoryChatService.messagesErrorHandler;

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

  /**
   * Effect to synchronize messages from the service resource and auto-scroll.
   *
   * Combines message sync and auto-scroll for better performance:
   * - Reads chatMessagesResource.value() to track resource changes
   * - Updates local messages signal when resource data changes
   * - Triggers auto-scroll after DOM updates via setTimeout
   *
   * The setTimeout ensures DOM is updated before scrolling.
   *
   * @see https://angular.dev/guide/signals#effects
   */
  private readonly syncAndScrollEffect = effect(() => {
    const resourceMessages = this.memoryChatService.chatMessagesResource.value();
    if (resourceMessages) {
      this.messages.set(resourceMessages);
      // Schedule scroll after DOM update
      setTimeout(() => this.scrollToBottom(), 0);
    }
  });

  /**
   * Effect to clear messages when chat selection changes.
   *
   * Monitors selectedChatId changes to reset the message list.
   * This ensures a clean state when switching between chats.
   *
   * Dependencies:
   * - memoryChatService.selectedChatId() - triggers on chat selection change
   *
   * Side effects:
   * - Clears messages signal (sets to empty array)
   * - Prepares component for new chat data
   */
  private readonly clearMessagesEffect = effect(() => {
    this.memoryChatService.selectedChatId();
    this.messages.set([]);
  });

  sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedInput = this.sanitizeInput(this.userInput().trim());
    this.updateMessages(sanitizedInput);
    this.isLoading = true;
    this.sendChatMessage(sanitizedInput);
  }

  private sanitizeInput(input: string): string {
    // Remove any potential script tags and sanitize the input
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  private updateMessages(content: string, type: ChatType = ChatType.USER): void {
    this.messages.update((messages: ChatMessage[]) => [...messages, { content, type }]);
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
    const currentChatId = this.memoryChatService.selectedChatId();

    if (currentChatId) {
      // Continue existing chat
      this.memoryChatService.continueChat(currentChatId, message)
        .pipe(
          catchError(() => {
            this.updateMessages('Sorry, I am unable to process your request at the moment.', ChatType.ASSISTANT);
            this.isLoading = false;
            return of();
          })
        )
        .subscribe((response: ChatMessage) => {
          if (response) {
            this.updateMessages(response.content, ChatType.ASSISTANT);
          }
          this.userInput.set('');
          this.isLoading = false;

          // Reload chat list if this was one of the first messages
          const currentMessages = this.memoryChatService.chatMessagesResource.value();
          if (currentMessages && currentMessages.length <= 2) {
            this.memoryChatService.chatsResource.reload();
          }
        });
    } else {
      // Start new chat
      this.memoryChatService.startNewChat(message)
        .pipe(
          catchError(() => {
            this.updateMessages('Sorry, I am unable to process your request at the moment.', ChatType.ASSISTANT);
            this.isLoading = false;
            return of();
          })
        )
        .subscribe((response: ChatStartResponse) => {
          if (response) {
            // Select the new chat and reload resources
            this.memoryChatService.selectChat(response.chatId);
            this.memoryChatService.chatsResource.reload();
          }
          this.userInput.set('');
          this.isLoading = false;
        });
    }
  }

  onRetryLoadMessages(): void {
    this.memoryChatService.retryLoadMessages();
  }

}
