import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-simple-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './simple-chat.component.html',
  styleUrl: './simple-chat.component.scss'
})
export class SimpleChatComponent {

  message = '';
  isLoading = false;

  messages = signal([
    { message: 'Hello, how can I help you today?', isBot: true },
  ]);

  sendMessage(): void {

    this.message.trim();

    if (!this.message) {
      return;
    }

    this.updateMessages(this.message);
    this.isLoading = true;
  }

  private updateMessages(message: string, isBot = false) {
    this.messages.update(messages => [...messages, { message, isBot }]);
    this.isLoading = false;
    this.message = '';
  }
}
