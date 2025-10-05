import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { LoggingService } from '../shared/logging.service';
import { ResourceErrorHandler, DEFAULT_RETRY_CONFIG } from '../shared/resource-error-handler';
import { Chat } from './chat';
import { ChatMessage } from './chat-message';
import { ChatResponse } from './chat-response';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  /**
   * API endpoints for chat operations.
   * Public to allow test files to reference these constants with full type safety.
   */
  public readonly API = '/api/chat';
  public readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);

  /**
   * Error handler for chat messages resource with retry logic
   */
  readonly messagesErrorHandler = new ResourceErrorHandler(DEFAULT_RETRY_CONFIG);

  /**
   * The currently selected chat ID for memory-based conversations.
   *
   * @remarks
   * Initially undefined, meaning no chat is selected. When a user selects
   * a chat from the list or creates a new one, this signal is updated.
   * The chatMessagesResource will automatically reload when this changes.
   *
   * @deprecated This service was originally used for both simple and memory chat.
   * Consider using MemoryChatService directly for memory-based chat functionality.
   */
  selectedChatId = signal<string | undefined>(undefined);

  chatIdEffect = effect(() => this.logger.debug('Selected chat ID changed', this.selectedChatId()));

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<Chat[]>(this.API_MEMORY))
  });

  chatMessagesResource = httpResource<ChatMessage[]>(() => {
    const chatId = this.selectedChatId();
    return chatId ? `${this.API_MEMORY}/${chatId}` : undefined;
  });

  constructor() {
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

  sendChatMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  createNewChat(): Observable<Chat> {
    return this.http.post<Chat>(this.API_MEMORY, {});
  }

  sendChatMessageWithId(message: string): Observable<ChatMessage> {
    const chatId = this.selectedChatId();
    if (!chatId) {
      throw new Error('No chat selected. Cannot send message without a chat ID.');
    }
    return this.http.post<ChatMessage>(`${this.API_MEMORY}/${chatId}`, { message });
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
