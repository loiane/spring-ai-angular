package com.loiane.api_ai.flightreservation;

/**
 * Exception thrown when a flight reservation operation fails.
 */
public class FlightReservationException extends RuntimeException {

    public FlightReservationException(String message) {
        super(message);
    }

    public FlightReservationException(String message, Throwable cause) {
        super(message, cause);
    }
}
