import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ChatResponse } from '../model/chat-response';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private http = inject(HttpClient);

  private readonly API = '/api/openai/chat';

  sendChatMessage(message: string) {
    return this.http.post<ChatResponse>(this.API, { message });
  }
}
