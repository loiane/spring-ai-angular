import { NgClass } from '@angular/common';
import { Component, signal, ViewChild, ElementRef, inject } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';
import { ChatService } from '../chat-service/chat.service';
import { catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-simple-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatToolbar, NgClass, MatIconModule],
  templateUrl: './simple-chat.component.html',
  styleUrl: './simple-chat.component.scss'
})
export class SimpleChatComponent {

  @ViewChild('chatHistory')
  private chatHistory!: ElementRef;

  private chatService = inject(ChatService);

  private readonly local = false;

  userInput = '';
  isLoading = false;

  message = new FormControl('');

  messages = signal([
    { text: 'Hello, how can I help you today?', isBot: true },
  ]);

  sendMessage(): void {
    this.trimUserMessage();
    if (this.userInput !== '') {
      this.updateMessages(this.userInput);
      this.isLoading = true;
      if (this.local) {
        this.simulateResponse();
      } else {
        this.sendChatMessage();
      }
    }
  }

  private trimUserMessage() {
    this.userInput = this.userInput.trim();
  }

  private updateMessages(text: string, isBot = false) {
    this.messages.update(messages => [...messages, { text, isBot }]);
    this.scrollToBottom();
  }

  private getResponse() {
    // TODO: Replace this with actual logic to get response from ChatGPT or a similar service
    setTimeout(() => {
      const response = 'This is a simulated response from ChatGPT.';
      this.updateMessages(response, true);
      this.isLoading = false;
    }, 2000);
  }

  private simulateResponse() {
    this.getResponse();
    this.userInput = '';
  }

  private scrollToBottom(): void {
    try {
      this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
    } catch(err) { }
  }

  private sendChatMessage() {
    this.chatService.sendChatMessage(this.userInput)
    .pipe(
      //delay(10000),
      catchError(() => {
        this.updateMessages('Sorry, I am unable to process your request at the moment.', true);
        this.isLoading = false;
        return throwError(() => new Error('Error occurred while sending message'));})
    )
    .subscribe(response => {
      this.updateMessages(response.message, true);
      this.userInput = '';
      this.isLoading = false;
    });
  }
}
