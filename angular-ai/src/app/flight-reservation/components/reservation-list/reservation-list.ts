import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FlightReservationService } from '../../services/flight-reservation.service';
import { FlightReservation, ReservationStatus } from '../../models/flight-reservation';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reservation-list.html',
  styleUrl: './reservation-list.scss'
})
export class ReservationListComponent {
  private readonly flightService = inject(FlightReservationService);

  reservations = this.flightService.reservationsResource;
  selectedReservation = this.flightService.selectedReservation;

  displayedColumns: string[] = ['number', 'name', 'date', 'status', 'from', 'to', 'seat', 'class', 'actions'];

  ReservationStatus = ReservationStatus;

  onSelectReservation(reservation: FlightReservation) {
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

  onRefresh() {
    this.flightService.refreshReservations();
  }
}
