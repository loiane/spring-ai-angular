import { Component } from '@angular/core';
import { ChatComponent } from '../../chat/chat.component';

@Component({
  selector: 'app-chat-list',
  imports: [ChatComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {

}
