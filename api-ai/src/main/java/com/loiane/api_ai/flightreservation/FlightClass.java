package com.loiane.api_ai.flightreservation;

/**
 * Enumeration representing the different classes of service available on flights.
 */
public enum FlightClass {
    ECONOMY("Economy"),
    PREMIUM_ECONOMY("Premium Economy"),
    BUSINESS("Business");

    private final String displayName;

    FlightClass(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
