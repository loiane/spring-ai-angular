package com.loiane.api_ai.tripconcierge.itinerary;

import java.time.LocalDate;

/**
 * A single day of a trip itinerary, with a weather summary and suggested activities.
 */
public record DayPlan(
        LocalDate date,
        String weatherSummary,
        String suggestedActivities
) {
}
