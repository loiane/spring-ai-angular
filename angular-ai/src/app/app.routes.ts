import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'chat',
    loadComponent: () => import('./chat/chat.component').then(c => c.ChatComponent)
  },
  { path: '**', redirectTo: 'chat' }
];
