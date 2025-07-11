package com.loiane.api_ai.flightreservation;

import java.time.LocalDateTime;

/**
 * Flight reservation record representing a passenger's flight booking.
 * Following Java Records best practice for DTOs and immutable data structures.
 */
public record FlightReservation(
        String reservationId,
        String flightNumber,
        String passengerFirstName,
        String passengerLastName,
        String passengerEmail,
        String departureAirport,
        String arrivalAirport,
        String seatNumber,
        FlightClass flightClass,
        ReservationStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    /**
     * Get the full passenger name
     */
    public String getPassengerFullName() {
        return passengerFirstName + " " + passengerLastName;
    }
}
