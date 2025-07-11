package com.loiane.api_ai.flightreservation;

/**
 * Request record for creating a new flight reservation.
 * Following Java Records best practice for DTOs.
 */
public record CreateReservationRequest(
        String flightNumber,
        String passengerFirstName,
        String passengerLastName,
        String passengerEmail,
        String departureAirport,
        String arrivalAirport,
        String seatNumber,
        FlightClass flightClass
) {}
