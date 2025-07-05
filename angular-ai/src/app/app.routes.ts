import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'memory-chat', pathMatch: 'full' },
  { path: 'simple-chat',
    loadComponent: () => import('./chat/simple-chat/simple-chat').then(c => c.SimpleChat)
  },
  { path: 'memory-chat',
    loadComponent: () => import('./chat/memory-chat/chat-list/chat-list').then(c => c.ChatList)
  },
  { path: '**', redirectTo: 'simple-chat' }
];
