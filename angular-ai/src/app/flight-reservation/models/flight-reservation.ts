export interface FlightReservation {
  number: string;
  name: string;
  date: string;
  status: ReservationStatus;
  from: string;
  to: string;
  seat: string;
  class: string;
}

export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

export interface CancellationRequest {
  reservationNumber: string;
  firstName: string;
  lastName: string;
  reason?: string;
}

export interface CancellationResponse {
  success: boolean;
  message: string;
  cancellationFee?: number;
}
