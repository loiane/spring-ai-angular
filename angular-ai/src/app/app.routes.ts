import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'simple-chat', pathMatch: 'full' },
  { path: 'simple-chat',
    loadComponent: () => import('./chat/simple-chat/simple-chat').then(c => c.SimpleChat)
  },
  { path: 'memory-chat',
    loadComponent: () => import('./chat/memory-chat/chat-list/chat-list').then(c => c.ChatList)
  },
  { path: 'flight-reservations',
    loadComponent: () => import('./flight-reservation/components/flight-reservation-main/flight-reservation-main').then(c => c.FlightReservationMainComponent)
  },
  { path: '**', redirectTo: 'simple-chat' }
];
