import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';
import { Chat } from '../../chat';
import { ChatMessage, ChatType } from '../../chat-message';
import { MemoryChatService } from '../memory-chat.service';

@Component({
  selector: 'app-chat-panel',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatIconModule, MarkdownToHtmlPipe],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss'
})
export class ChatPanel {

  @ViewChild('chatHistory')
  private readonly chatHistory!: ElementRef;

  private readonly memoryChatService = inject(MemoryChatService);

  userInput = '';
  isLoading = false;

  messages = this.memoryChatService.chatMessagesResource.value;

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
    this.messages.update((messages: ChatMessage[] | undefined) => [ ...(messages ?? []), { content, type } ]);
    this.scrollToBottom();
  }

   private scrollToBottom(): void {
    try {
      this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
    } catch(err) {
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
        .subscribe((response: Chat) => {
          if (response) {
            // Select the new chat and reload resources
            this.memoryChatService.selectChat(response.id);
            this.memoryChatService.chatsResource.reload();
          }
          this.userInput = '';
          this.isLoading = false;
        });
    }
  }

}
