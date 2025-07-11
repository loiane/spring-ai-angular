package com.loiane.api_ai.flightreservation;

/**
 * Exception thrown when a flight reservation is not found.
 */
public class FlightReservationNotFoundException extends RuntimeException {

    public FlightReservationNotFoundException(String message) {
        super(message);
    }

    public FlightReservationNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
