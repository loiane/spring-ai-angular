import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { FlightReservation, ReservationStatus } from '../../models/flight-reservation';
import { ResourceErrorComponent } from '../../../shared/resource-error';

@Component({
  selector: 'app-reservation-list',
  imports: [
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ResourceErrorComponent
],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationList {
  private readonly flightService = inject(FlightReservationService);

  reservations = this.flightService.reservationsResource;
  selectedReservation = this.flightService.selectedReservation;
  errorHandler = this.flightService.reservationsErrorHandler;

  displayedColumns: string[] = ['number', 'name', 'date', 'status', 'from', 'to', 'seat', 'class', 'actions'];

  ReservationStatus = ReservationStatus;

  onSelectReservation(reservation: FlightReservation): void {
    this.flightService.selectReservation(reservation);
  }

  getStatusChipClass(status: ReservationStatus): string {
    switch (status) {
      case ReservationStatus.CONFIRMED:
        return 'status-confirmed';
      case ReservationStatus.PENDING:
        return 'status-pending';
      case ReservationStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  onRefresh(): void {
    this.flightService.refreshReservations();
  }

  onRetry(): void {
    this.flightService.retryLoadReservations();
  }
}
