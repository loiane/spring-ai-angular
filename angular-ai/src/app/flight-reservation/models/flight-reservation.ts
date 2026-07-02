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
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED'
}

/**
 * Reservation payload as returned by the backend API
 * (api-ai FlightReservationController).
 */
export interface ApiFlightReservation {
  reservationId: string;
  flightNumber: string;
  passengerFirstName: string;
  passengerLastName: string;
  passengerEmail: string;
  departureAirport: string;
  arrivalAirport: string;
  seatNumber: string;
  flightClass: string;
  status: ReservationStatus;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Maps the backend reservation payload to the UI model.
 */
export function toFlightReservation(api: ApiFlightReservation): FlightReservation {
  return {
    number: api.reservationId,
    name: `${api.passengerFirstName} ${api.passengerLastName}`,
    date: api.createdAt ? api.createdAt.split('T')[0] : '',
    status: api.status,
    from: api.departureAirport,
    to: api.arrivalAirport,
    seat: api.seatNumber,
    class: formatFlightClass(api.flightClass)
  };
}

function formatFlightClass(flightClass: string): string {
  return flightClass
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
