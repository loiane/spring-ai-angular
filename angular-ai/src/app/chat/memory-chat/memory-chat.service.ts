import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
import { ResourceErrorHandler, DEFAULT_RETRY_CONFIG } from '../../shared/resource-error-handler';
import { Chat, ChatStartResponse } from '../chat';
import { ChatMessage } from '../chat-message';

@Injectable({
  providedIn: 'root'
})
export class MemoryChatService {

  /**
   * API endpoint for memory-based chat operations.
   * Public to allow test files to reference this constant with full type safety.
   */
  public readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);

  /**
   * Error handlers for resources with retry logic
   */
  readonly chatsErrorHandler = new ResourceErrorHandler(DEFAULT_RETRY_CONFIG);
  readonly messagesErrorHandler = new ResourceErrorHandler(DEFAULT_RETRY_CONFIG);

  /**
   * The currently selected chat ID for conversation history.
   *
   * @remarks
   * - `undefined`: No chat is selected (initial state or after clearing selection)
   * - `string`: A valid chat ID is selected, and the chat history will be loaded
   *
   * When this signal changes, the `chatMessagesResource` will automatically
   * reload the message history for the newly selected chat.
   */
  selectedChatId = signal<string | undefined>(undefined);

  private readonly chatIdEffect = effect(() =>
    this.logger.debug('Memory chat - Selected chat ID', this.selectedChatId())
  );

  /**
   * List all chats: GET /api/chat-memory
   */
  chatsResource = httpResource<Chat[]>(() => this.API_MEMORY);

  /**
   * Get chat history: GET /api/chat-memory/{chatId}
   *
   * @remarks
   * This resource will automatically reload when `selectedChatId` changes.
   * If no chat is selected (undefined), the resource will not make a request.
   */
  chatMessagesResource = httpResource<ChatMessage[]>(() => {
    const chatId = this.selectedChatId();
    return chatId ? `${this.API_MEMORY}/${chatId}` : undefined;
  });

  constructor() {
    // Effect to monitor chats resource errors
    effect(() => {
      const status = this.chatsResource.status();
      const error = this.chatsResource.error();

      if (status === 'error' && error) {
        this.logger.error('Error loading chats', error);
        this.chatsErrorHandler.handleError(error);
      } else if (status === 'resolved') {
        this.chatsErrorHandler.reset();
      }
    });

    // Effect to monitor chat messages resource errors
    effect(() => {
      const status = this.chatMessagesResource.status();
      const error = this.chatMessagesResource.error();

      if (status === 'error' && error) {
        this.logger.error('Error loading chat messages', error);
        this.messagesErrorHandler.handleError(error);
      } else if (status === 'resolved') {
        this.messagesErrorHandler.reset();
      }
    });
  }

  /**
   * Start new chat: POST /api/chat-memory/start with first message
   */
  startNewChat(message: string): Observable<ChatStartResponse> {
    return this.http.post<ChatStartResponse>(`${this.API_MEMORY}/start`, { message });
  }

  /**
   * Continue chat: POST /api/chat-memory/{chatId} with subsequent messages
   */
  continueChat(chatId: string, message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.API_MEMORY}/${chatId}`, { message });
  }

  /**
   * Set the selected chat and reload messages
   */
  selectChat(chatId: string): void {
    this.selectedChatId.set(chatId);
  }

  /**
   * Clear selected chat
   */
  clearSelection(): void {
    this.selectedChatId.set(undefined);
  }

  /**
   * Retry loading chats using error handler's retry logic
   */
  retryLoadChats(): void {
    this.chatsErrorHandler.retry(() => {
      this.chatsResource.reload();
    });
  }

  /**
   * Retry loading chat messages using error handler's retry logic
   */
  retryLoadMessages(): void {
    this.messagesErrorHandler.retry(() => {
      this.chatMessagesResource.reload();
    });
  }
}
