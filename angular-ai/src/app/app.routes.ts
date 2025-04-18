import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'simple-chat', pathMatch: 'full' },
  { path: 'simple-chat',
    loadComponent: () => import('./simple-chat/simple-chat.component').then(c => c.SimpleChatComponent)
  },
  { path: 'memory-chat',
    loadComponent: () => import('./memory-chat/chat-list/chat-list.component').then(c => c.ChatListComponent)
  },
  { path: '**', redirectTo: 'simple-chat' }
];
