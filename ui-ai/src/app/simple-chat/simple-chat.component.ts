import { NgClass } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
  selector: 'app-simple-chat',
  imports: [MatCardModule, MatInputModule, MatButtonModule, FormsModule, MatToolbar, NgClass, MatIconModule],
  templateUrl: './simple-chat.component.html',
  styleUrl: './simple-chat.component.scss'
})
export class SimpleChatComponent {

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
      this.userInput = '';
      this.getResponse();
    }
  }

  private trimUserMessage() {
    this.userInput = this.userInput.trim();
  }

  private updateMessages(text: string, isBot = false) {
    this.messages.update(messages => [...messages, { text, isBot }]);
  }

  private getResponse() {
    // TODO: Replace this with actual logic to get response from ChatGPT or a similar service
    setTimeout(() => {
      const response = 'This is a simulated response from ChatGPT.';
      this.updateMessages(response, true);
      this.isLoading = false;
    }, 2000);
  }
}
