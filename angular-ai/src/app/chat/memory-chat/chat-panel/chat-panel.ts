import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
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
    FormField,
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
  protected readonly MAX_LENGTH = MAX_MESSAGE_LENGTH;

  protected userInput = signal('');
  protected readonly chatForm = form(this.userInput, p => maxLength(p, MAX_MESSAGE_LENGTH));
  protected isLoading = signal(false);

  protected messages = signal<ChatMessage[]>([]);
  protected messagesResource = this.memoryChatService.chatMessagesResource;
  protected messagesErrorHandler = this.memoryChatService.messagesErrorHandler;

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

  protected sendMessage(): void {
    if (!this.canSend()) {
      return;
    }

    const sanitizedInput = this.sanitizeInput(this.userInput().trim());
    this.updateMessages(sanitizedInput);
    this.isLoading.set(true);
    this.sendChatMessage(sanitizedInput);
  }

  private sanitizeInput(input: string): string {
    // Remove any potential script tags and sanitize the input
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  private updateMessages(content: string, type: ChatType = ChatType.USER, streaming = false): void {
    this.messages.update((messages: ChatMessage[]) => [...messages, { content, type, streaming }]);
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
      // Continue existing chat, streaming the assistant's reply
      this.updateMessages('', ChatType.ASSISTANT, true);

      this.memoryChatService.continueChatStream(currentChatId, message)
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

            // Reload chat list if this was one of the first messages
            const currentMessages = this.memoryChatService.chatMessagesResource.value();
            if (currentMessages && currentMessages.length <= 2) {
              this.memoryChatService.chatsResource.reload();
            }
          }
        });
    } else {
      // Start new chat
      this.memoryChatService.startNewChat(message)
        .pipe(
          catchError(() => {
            this.updateMessages('Sorry, I am unable to process your request at the moment.', ChatType.ASSISTANT);
            this.isLoading.set(false);
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
          this.isLoading.set(false);
        });
    }
  }

  private appendToLastMessage(delta: string, replace = false): void {
    this.messages.update((messages: ChatMessage[]) => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, content: replace ? delta : last.content + delta };
      return [...messages.slice(0, lastIndex), updated];
    });
  }

  private setLastMessageStreaming(streaming: boolean): void {
    this.messages.update((messages: ChatMessage[]) => {
      const lastIndex = messages.length - 1;
      const last = messages[lastIndex];
      const updated = { ...last, streaming };
      return [...messages.slice(0, lastIndex), updated];
    });
  }

  protected onRetryLoadMessages(): void {
    this.memoryChatService.retryLoadMessages();
  }

}
