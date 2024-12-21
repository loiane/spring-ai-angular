import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'memory-chat', pathMatch: 'full' },
  { path: 'chat',
    loadComponent: () => import('./chat/chat.component').then(c => c.ChatComponent)
  },
  { path: 'memory-chat',
    loadComponent: () => import('./memory-chat/chat-list/chat-list.component').then(c => c.ChatListComponent)
  },
  { path: '**', redirectTo: 'chat' }
];
