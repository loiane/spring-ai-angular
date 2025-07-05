import { Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';
import { ChatStartResponse } from '../../chat';
import { ChatMessage, ChatType } from '../../chat-message';
import { MemoryChatService } from '../memory-chat.service';

@Component({
  selector: 'app-chat-panel',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatIconModule, MarkdownToHtmlPipe],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss'
})
export class ChatPanel {

  private readonly chatHistory = viewChild.required<ElementRef>('chatHistory');

  private readonly memoryChatService = inject(MemoryChatService);

  userInput = '';
  isLoading = false;

  messages = signal<ChatMessage[]>([]);

  // Effect to sync messages from the service resource
  private readonly syncMessagesEffect = effect(() => {
    const resourceMessages = this.memoryChatService.chatMessagesResource.value();
    if (resourceMessages) {
      this.messages.set(resourceMessages);
    }
  });

  // Effect to auto-scroll when messages change
  private readonly autoScrollEffect = effect(() => {
    this.messages(); // Read the signal to track changes
    setTimeout(() => this.scrollToBottom(), 0); // Use setTimeout to ensure DOM is updated
  });

  // Effect to clear messages when selectedChatId changes
  private readonly clearMessagesEffect = effect(() => {
    this.memoryChatService.selectedChatId();
    this.messages.set([]);
  });

  sendMessage(): void {
    this.trimUserMessage();
    if (this.userInput !== '' && !this.isLoading) {
      this.updateMessages(this.userInput);
      this.isLoading = true;
      this.sendChatMessage();
    }
  }

  private trimUserMessage() {
    this.userInput = this.userInput.trim();
  }

  private updateMessages(content: string, type: ChatType = ChatType.USER) {
    this.messages.update((messages: ChatMessage[]) => [...messages, { content, type }]);
  }

  private scrollToBottom(): void {
    try {
      const chatElement = this.chatHistory();
      if (chatElement?.nativeElement) {
        chatElement.nativeElement.scrollTop = chatElement.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Failed to scroll chat history:', err);
    }
  }

  private sendChatMessage() {
    const currentChatId = this.memoryChatService.selectedChatId();
    const message = this.userInput;

    if (currentChatId) {
      // Continue existing chat
      this.memoryChatService.continueChat(currentChatId, message)
        .pipe(
          catchError(() => {
            this.updateMessages('Sorry, I am unable to process your request at the moment.', ChatType.ASSISTANT);
            this.isLoading = false;
            return of();
          })
        )
        .subscribe((response: ChatMessage) => {
          if (response) {
            this.updateMessages(response.content, ChatType.ASSISTANT);
          }
          this.userInput = '';
          this.isLoading = false;

          // Reload chat list if this was one of the first messages
          const currentMessages = this.memoryChatService.chatMessagesResource.value();
          if (currentMessages && currentMessages.length <= 2) {
            this.memoryChatService.chatsResource.reload();
          }
        });
    } else {
      // Start new chat
      this.memoryChatService.startNewChat(message)
        .pipe(
          catchError(() => {
            this.updateMessages('Sorry, I am unable to process your request at the moment.', ChatType.ASSISTANT);
            this.isLoading = false;
            return of();
          })
        )
        .subscribe((response: ChatStartResponse) => {
          if (response) {
            // Select the new chat and reload resources
            this.memoryChatService.selectChat(response.chatId);
            this.memoryChatService.chatsResource.reload();
          }
          this.userInput = '';
          this.isLoading = false;
        });
    }
  }

}
