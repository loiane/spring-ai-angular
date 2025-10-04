import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReservationListComponent } from '../reservation-list/reservation-list';
import { ConciergeChatComponent } from '../concierge-chat/concierge-chat';

@Component({
  selector: 'app-flight-reservation-main',
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ReservationListComponent,
    ConciergeChatComponent
  ],
  templateUrl: './flight-reservation-main.html',
  styleUrl: './flight-reservation-main.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlightReservationMainComponent {
  sidenavOpened = true;

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
