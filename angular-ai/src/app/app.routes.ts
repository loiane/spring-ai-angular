import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'simple-chat', pathMatch: 'full' },
  { path: 'simple-chat',
    loadComponent: () => import('./chat/simple-chat/simple-chat').then(c => c.SimpleChat)
  },
  { path: 'memory-chat',
    loadComponent: () => import('./chat/memory-chat/chat-list/chat-list').then(c => c.ChatList)
  },
  { path: 'chat-with-document',
    loadComponent: () => import('./chat/document-chat/document-chat').then(c => c.DocumentChat)
  },
  { path: 'flight-reservations',
    loadComponent: () => import('./flight-reservation/components/flight-reservation-main/flight-reservation-main').then(c => c.FlightReservationMain)
  },
  { path: 'book-cover-identifier',
    loadComponent: () => import('./book-cover-identifier/book-cover-identifier').then(c => c.BookCoverIdentifier)
  },
  { path: '**', redirectTo: 'simple-chat' }
];
