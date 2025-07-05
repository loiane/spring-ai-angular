import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Chat } from './chat';

@Injectable({
  providedIn: 'root'
})
export class MemoryChatService {

  private readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);

  /**
   * GET /api/chat-memory
   */
  chatsResource = httpResource<Chat[]>(() => this.API_MEMORY);

}
