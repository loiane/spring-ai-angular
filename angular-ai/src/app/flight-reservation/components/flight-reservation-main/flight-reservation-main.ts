import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReservationList } from '../reservation-list/reservation-list';
import { ConciergeChat } from '../concierge-chat/concierge-chat';

@Component({
  selector: 'app-flight-reservation-main',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ReservationList,
    ConciergeChat
],
  templateUrl: './flight-reservation-main.html',
  styleUrl: './flight-reservation-main.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlightReservationMain {
  sidenavOpened = true;

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
