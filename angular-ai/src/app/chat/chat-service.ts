import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { postSse } from '../shared/sse-client';
import { ChatResponse } from './chat-response';

/**
 * Simple Chat Service
 *
 * Handles simple, stateless chat interactions without conversation history.
 * Each message is independent with no memory of previous messages.
 *
 * **Responsibilities:**
 * - Send single chat messages without maintaining context
 * - Stateless request/response pattern (no conversation history)
 * - Lightweight interface for one-off chat interactions
 *
 * **When to use this service:**
 * - Simple Q&A interactions where context doesn't matter
 * - One-time queries or requests
 * - When you don't need to maintain conversation history
 *
 * **For memory-based conversations, use MemoryChatService instead:**
 * - Multi-turn conversations with context
 * - Chat sessions that maintain history
 * - Conversations that reference previous messages
 *
 * @see MemoryChatService for memory-based conversations with history
 */
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  /**
   * API endpoint for simple chat operations.
   *
   * @remarks
   * Public to allow test files to reference this constant with full type safety.
   */
  public readonly API = '/api/chat';

  private readonly http = inject(HttpClient);

  /**
   * Send a simple chat message without conversation context.
   *
   * Each call is independent and does not maintain any history or context
   * from previous messages. The response is generated based solely on the
   * current message content.
   *
   * @param message - The user's message to send to the AI
   * @returns Observable of the AI's response
   *
   * @example
   * ```typescript
   * chatService.sendChatMessage('What is the weather today?')
   *   .subscribe(response => {
   *     console.log(response.message);
   *   });
   * ```
   */
  sendChatMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.API, { message });
  }

  /**
   * Send a simple chat message and stream the AI's response as it is generated.
   *
   * Each emission is an incremental text chunk (delta), not the full accumulated
   * answer. Callers are responsible for concatenating chunks as they arrive.
   *
   * @param message - The user's message to send to the AI
   * @returns Observable emitting one text delta per streamed chunk
   *
   * @example
   * ```typescript
   * chatService.sendChatMessageStream('Tell me a story')
   *   .subscribe(delta => console.log(delta));
   * ```
   */
  sendChatMessageStream(message: string): Observable<string> {
    return postSse<ChatResponse>(`${this.API}/stream`, { message })
      .pipe(
        filter(event => event.event === 'message'),
        map(event => event.data.message)
      );
  }
}
