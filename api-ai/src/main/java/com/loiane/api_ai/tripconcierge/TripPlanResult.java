package com.loiane.api_ai.tripconcierge;

import java.util.List;

import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;

/**
 * The composed result of a trip planning request. Budget and travel-docs fields are
 * populated in later stages of the concierge pipeline.
 */
public record TripPlanResult(
        TripPlanRequest request,
        FlightOption selectedFlight,
        List<DayPlan> itinerary,
        String summary
) {
}
