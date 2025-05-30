import { NgClass } from '@angular/common';
import { Component, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, of } from 'rxjs';
import { ChatResponse } from '../../chat-response';
import { ChatService } from '../../chat-service';

@Component({
  selector: 'app-chat-panel',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, NgClass, MatIconModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss'
})
export class ChatPanel {

  @ViewChild('chatHistory')
  private readonly chatHistory!: ElementRef;

  chatId = input('');

  private readonly chatService = inject(ChatService);

  userInput = '';
  isLoading = false;

  messages = signal<ChatResponse[]>([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

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

  private updateMessages(message: string, isBot = false) {
    this.messages.update(messages => [...messages, { message, isBot }]);
    this.scrollToBottom();
  }

   private scrollToBottom(): void {
    try {
      this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
    } catch(err) { }
  }

  private sendChatMessage() {
      this.chatService.sendChatMessageWithId(this.chatId(), this.userInput)
      .pipe(
        //delay(10000),
        catchError(() => {
          this.updateMessages('Sorry, I am unable to process your request at the moment.', true);
          this.isLoading = false;
          return of(); // <-- fix: return an empty observable instead of re-throwing
        })
      )
      .subscribe((response: ChatResponse) => {
        if (response) {
          this.updateMessages(response.message, true);
        }
        this.userInput = '';
        this.isLoading = false;
      });
    }

}
