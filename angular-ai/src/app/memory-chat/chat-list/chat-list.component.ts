import { Component } from '@angular/core';
import { ChatComponent } from '../../chat/chat.component';
import { ChatType } from '../../chat/model/chat-type';

@Component({
  selector: 'app-chat-list',
  imports: [ChatComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {

  readonly memoryChat = ChatType.MemoryChat;
}
