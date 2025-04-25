import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable, Resource } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private readonly API = '/api/chat';

  private http = inject(HttpClient);

  sendChatMessage(message: string) {
    return this.http.post<ChatResponse>(this.API, { message });
  }

}

export interface ChatResponse {
  message: string;
  isBot: boolean;
}
