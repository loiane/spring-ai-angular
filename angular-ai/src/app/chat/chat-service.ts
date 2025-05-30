import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource } from '@angular/core';
import { ChatResponse } from './chat-response';
import { Chat } from './chat';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly API = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<Chat[]>(this.API))
  });

  sendChatMessage(message: string) {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  createNewChat() {
    return this.http.post<string>(this.API, {});
  }

  sendChatMessageWithId(chatId: string, message: string) {
    return this.http.post<ChatResponse>(`${this.API}/${chatId}`, { message });
  }
}
