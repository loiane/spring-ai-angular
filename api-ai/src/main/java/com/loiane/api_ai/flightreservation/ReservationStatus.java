package com.loiane.api_ai.flightreservation;

/**
 * Enumeration representing the possible statuses of a flight reservation.
 */
public enum ReservationStatus {
    CONFIRMED("Confirmed"),
    CANCELLED("Cancelled"),
    CHECKED_IN("Checked In"),
    COMPLETED("Completed");

    private final String displayName;

    ReservationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
