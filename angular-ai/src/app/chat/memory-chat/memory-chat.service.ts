import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../../shared/logging.service';
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
}
