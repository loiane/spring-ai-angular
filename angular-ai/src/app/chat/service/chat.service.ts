import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ChatResponse } from '../model/chat-response';
import { ChatType } from '../model/chat-type';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient);

  readonly API = '/api/openai/chat';
  readonly API_MEMORY = '/api/openai/chat-memory';

  sendChatMessage(message: string, api = ChatType.Chat) {
    return this.http.post<ChatResponse>(api, { message });
  }
}
