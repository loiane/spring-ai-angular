import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, resource, signal } from '@angular/core';
import { ChatResponse } from './chat-response';
import { Chat } from './chat';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from './chat-message';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly API = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  selectedChatId = signal('');

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<ChatMessage[]>(this.API))
  });

  chatMessagesResource = httpResource<ChatMessage[]>(() => `${this.API}/${this.selectedChatId()}`);

  sendChatMessage(message: string) {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  createNewChat() {
    return this.http.post<string>(this.API, {});
  }

  sendChatMessageWithId(message: string) {
    return this.http.post<ChatMessage>(`${this.API}/${this.selectedChatId()}`, { message });
  }
}
