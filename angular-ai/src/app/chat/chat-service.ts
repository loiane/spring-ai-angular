import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { LoggingService } from '../shared/logging.service';
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
}
