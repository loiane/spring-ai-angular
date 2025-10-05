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

  private readonly API = '/api/chat';
  private readonly API_MEMORY = '/api/chat-memory';

  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggingService);

  selectedChatId = signal('1111111');

  chatIdEffect = effect(() => this.logger.debug('Selected chat ID changed', this.selectedChatId()));

  // Using the new httpResource for reactive data fetching
  chatsResource = resource({
    loader: () => firstValueFrom(this.http.get<Chat[]>(this.API_MEMORY))
  });

  chatMessagesResource = httpResource<ChatMessage[]>(() => `${this.API_MEMORY}/${this.selectedChatId()}`);

  sendChatMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  createNewChat(): Observable<Chat> {
    return this.http.post<Chat>(this.API_MEMORY, {});
  }

  sendChatMessageWithId(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.API_MEMORY}/${this.selectedChatId()}`, { message });
  }
}
