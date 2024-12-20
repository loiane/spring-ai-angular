import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './service/chat.service';
import { ChatResponse } from './model/chat-response';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  title = 'Simple Chat';
  message = '';

  private chatService = inject(ChatService);

  messages = signal([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

  sendChatMessage() {
    this.message.trim();
    this.updateMessages(this.message);

    this.chatService.sendChatMessage(this.message)
    .subscribe(response => {
      this.updateMessages(response.message, true);
      this.message = '';
    });
  }

  private updateMessages(message: string, isBot = false) {
    this.messages.update(messages => [...messages, { message, isBot }]);
  }
}
