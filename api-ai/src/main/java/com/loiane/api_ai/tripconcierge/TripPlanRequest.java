package com.loiane.api_ai.tripconcierge;

import java.time.LocalDate;

/**
 * Structured trip planning request, parsed from the traveler's free-text message.
 */
public record TripPlanRequest(
        String origin,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        double budget,
        String budgetCurrency,
        int travelers,
        String interests
) {
}
