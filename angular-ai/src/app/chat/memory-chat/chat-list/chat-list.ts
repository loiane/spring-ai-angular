import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ChatService } from '../../chat-service';
import { ChatPanel } from '../chat-panel/chat-panel';

@Component({
  selector: 'app-chat-list',
  imports: [MatSidenavModule, MatCardModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, ChatPanel],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatList {

  private readonly chatService = inject(ChatService);

  // Using the new httpResource for reactive data
  chats = this.chatService.chatsResource;

  selectedChatId = signal<string | null>(null);

  selectChat(chatId: string) {
    this.selectedChatId.set(chatId);
  }

  createNewChat() {
    this.chatService.createNewChat().subscribe({
      next: (chatId) => {
        // Reload the chats resource to include the new chat
        this.chats.reload();
        this.selectedChatId.set(chatId);
      },
      error: (error) => {
        console.error('Error creating new chat:', error);
      }
    });
  }

  deleteChat(chatId: string, event: Event) {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    // TODO: Implement delete functionality when backend endpoint is available
    console.log('Delete chat:', chatId);
  }
}
