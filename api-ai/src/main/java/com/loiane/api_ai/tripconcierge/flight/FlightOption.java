package com.loiane.api_ai.tripconcierge.flight;

import java.time.LocalDate;

/**
 * A mock flight option returned by the flight search tool.
 */
public record FlightOption(
        String airline,
        String flightNumber,
        String origin,
        String destination,
        LocalDate departureDate,
        String departureTime,
        String arrivalTime,
        double price,
        String currency
) {
}
