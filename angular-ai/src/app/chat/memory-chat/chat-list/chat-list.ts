import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LoggingService } from '../../../shared/logging.service';
import { ResourceErrorComponent } from '../../../shared/resource-error';
import { MemoryChatService } from '../memory-chat.service';
import { ChatPanel } from '../chat-panel/chat-panel';

@Component({
  selector: 'app-chat-list',
  imports: [
    MatSidenavModule,
    MatCardModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    ResourceErrorComponent,
    ChatPanel
  ],
  templateUrl: './chat-list.html',
  styleUrl: './chat-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatList {

  protected readonly memoryChatService = inject(MemoryChatService);
  private readonly logger = inject(LoggingService);

  protected chats = this.memoryChatService.chatsResource;
  protected errorHandler = this.memoryChatService.chatsErrorHandler;

  protected selectChat(chatId: string): void {
    this.memoryChatService.selectChat(chatId);
  }

  protected createNewChat(): void {
    this.memoryChatService.clearSelection();
  }

  protected deleteChat(chatId: string, event: Event): void {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    this.logger.debug('Delete chat requested', chatId);
    // Delete functionality to be implemented
  }

  protected onRetry(): void {
    this.memoryChatService.retryLoadChats();
  }
}
