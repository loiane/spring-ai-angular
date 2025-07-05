import { Component, inject } from '@angular/core';
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
  imports: [MatCardModule, MatToolbarModule, MatSidenavModule, MatListModule,
    MatButtonModule, MatIconModule, ChatPanel],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss'
})
export class ChatList {

  memoryChatService = inject(MemoryChatService);

  chats = this.memoryChatService.chatsResource;

  createNewChat() {
  }
}
