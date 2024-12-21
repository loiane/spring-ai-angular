import { Component, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './service/chat.service';
import { catchError, delay, throwError } from 'rxjs';
import { ChatType } from './model/chat-type';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  @Input() title = 'Simple Chat';
  @Input() chatType = ChatType.Chat;

  message = '';
  isLoading = false;

  private chatService = inject(ChatService);

  messages = signal([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

  sendChatMessage() {
    this.message.trim();

    if (!this.message) {
      return;
    }

    this.updateMessages(this.message);
    this.isLoading = true;

    this.chatService.sendChatMessage(this.message)
    .pipe(
      //delay(10000),
      catchError(error => {
        this.updateMessages('Sorry, I am unable to process your request at the moment.', true);
        this.isLoading = false;
        return throwError(error);
      })
    )
    .subscribe(response => {
      this.updateMessages(response.message, true);
      this.message = '';
      this.isLoading = false;
    });
  }

  private updateMessages(message: string, isBot = false) {
    this.messages.update(messages => [...messages, { message, isBot }]);
  }
}
