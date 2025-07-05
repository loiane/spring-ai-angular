import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { Chat, ChatStartResponse } from '../chat';
import { ChatMessage } from '../chat-message';

@Injectable({
  providedIn: 'root'
})
export class MemoryChatService {

  private readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  selectedChatId = signal<string | undefined>(undefined);

  private readonly chatIdEffect = effect(() => console.log('Selected chat ID:', this.selectedChatId()));

  /**
   * List all chats: GET /api/chat-memory
   */
  chatsResource = httpResource<Chat[]>(() => this.API_MEMORY);

  /**
   * Get chat history: GET /api/chat-memory/{chatId}
   */
  chatMessagesResource = httpResource<ChatMessage[]>(() => {
    const chatId = this.selectedChatId();
    return chatId ? `${this.API_MEMORY}/${chatId}` : undefined;
  });

  /**
   * Start new chat: POST /api/chat-memory/start with first message
   */
  startNewChat(message: string) {
    return this.http.post<ChatStartResponse>(`${this.API_MEMORY}/start`, { message });
  }

  /**
   * Continue chat: POST /api/chat-memory/{chatId} with subsequent messages
   */
  continueChat(chatId: string, message: string) {
    return this.http.post<ChatMessage>(`${this.API_MEMORY}/${chatId}`, { message });
  }

  /**
   * Set the selected chat and reload messages
   */
  selectChat(chatId: string) {
    this.selectedChatId.set(chatId);
  }

  /**
   * Clear selected chat
   */
  clearSelection() {
    this.selectedChatId.set(undefined);
  }
}
