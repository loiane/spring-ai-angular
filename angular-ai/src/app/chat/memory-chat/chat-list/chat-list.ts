import { Component, inject, resource } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MemoryChatService } from '../memory-chat.service';
import { ChatPanel } from '../chat-panel/chat-panel';

@Component({
  selector: 'app-chat-list',
  imports: [MatSidenavModule, MatCardModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, ChatPanel],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatList {

  readonly memoryChatService = inject(MemoryChatService);

  chats = this.memoryChatService.chatsResource;

  selectChat(chatId: string) {
    this.memoryChatService.selectChat(chatId);
  }

  createNewChat() {
    this.memoryChatService.clearSelection();
  }

  deleteChat(chatId: string, event: Event) {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    console.log('Delete chat:', chatId);
  }
}
