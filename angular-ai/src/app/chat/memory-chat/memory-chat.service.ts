import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Chat, ChatStartResponse } from '../chat';
import { ChatMessage } from '../chat-message';

@Injectable({
  providedIn: 'root'
})
export class MemoryChatService {

  private readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  selectedChatId = signal<string | undefined>(undefined);

  chatIdEffect = effect(() => console.log('Selected chat ID:', this.selectedChatId()));

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<Chat[]>(this.API_MEMORY))
  });

  // Get chat history for selected chat
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
   * Get chat history: GET /api/chat-memory/{chatId}
   */
  getChatHistory(chatId: string) {
    return this.http.get<ChatMessage[]>(`${this.API_MEMORY}/${chatId}`);
  }

  /**
   * List all chats: GET /api/chat-memory
   */
  getAllChats() {
    return this.http.get<Chat[]>(this.API_MEMORY);
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
