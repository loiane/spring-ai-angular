import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SimpleChatComponent } from '../../simple-chat/simple-chat.component';

@Component({
  selector: 'app-chat-list',
  imports: [MatSidenavModule, MatCardModule, MatToolbarModule, MatListModule, SimpleChatComponent],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {

}
