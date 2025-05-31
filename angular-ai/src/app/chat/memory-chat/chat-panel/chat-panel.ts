import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { MarkdownToHtmlPipe } from '../../../shared/markdown-to-html.pipe';
import { ChatMessage, ChatType } from '../../chat-message';
import { ChatService } from '../../chat-service';

@Component({
  selector: 'app-chat-panel',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatIconModule, MarkdownToHtmlPipe],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss'
})
export class ChatPanel {

  @ViewChild('chatHistory')
  private readonly chatHistory!: ElementRef;

  private readonly chatService = inject(ChatService);

  userInput = '';
  isLoading = false;

  messages = this.chatService.chatMessagesResource.value;

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
    this.messages.update(messages => [ ...(messages ?? []), { content, type } ]);
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
      this.chatService.sendChatMessageWithId(this.userInput)
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
        if (this.chatService.chatMessagesResource.asReadonly.length <= 2) {
          this.chatService.chatsResource.reload();
        }
      });
    }

}
