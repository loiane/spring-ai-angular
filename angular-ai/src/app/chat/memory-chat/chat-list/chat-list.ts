import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ChatService } from '../../chat-service';
import { ChatPanel } from '../chat-panel/chat-panel';
import { Chat } from '../../chat';

@Component({
  selector: 'app-chat-list',
  imports: [MatSidenavModule, MatCardModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, ChatPanel],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatList {

  readonly chatService = inject(ChatService);

  // Using the new httpResource for reactive data
  chats = this.chatService.chatsResource;

  selectChat(chatId: string) {
    this.chatService.selectedChatId.set(chatId);
  }

  createNewChat() {
    this.chatService.createNewChat()
    .subscribe((chat: Chat) => {
      this.selectChat(chat.id);
      this.chats.reload();
    }
   );
  }

  deleteChat(chatId: string, event: Event) {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    // TODO: Implement delete functionality when backend endpoint is available
    console.log('Delete chat:', chatId);
  }
}
