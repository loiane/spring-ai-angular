import { HttpClient, httpResource } from '@angular/common/http';
import { effect, inject, Injectable, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Chat } from './chat';
import { ChatMessage } from './chat-message';
import { ChatResponse } from './chat-response';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly API = '/api/chat';
  private readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  selectedChatId = signal('1111111');

  chatIdEffect = effect(() => console.log(this.selectedChatId()));

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<Chat[]>(this.API_MEMORY))
  });

  chatMessagesResource = httpResource<ChatMessage[]>(() => `${this.API_MEMORY}/${this.selectedChatId()}`);

  sendChatMessage(message: string) {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  createNewChat() {
    return this.http.post<Chat>(this.API_MEMORY, {});
  }

  sendChatMessageWithId(message: string) {
    return this.http.post<ChatMessage>(`${this.API_MEMORY}/${this.selectedChatId()}`, { message });
  }
}
