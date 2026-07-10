package com.loiane.api_ai.tripconcierge;

import com.loiane.api_ai.tripconcierge.flight.FlightOption;

/**
 * The composed result of a trip planning request. Itinerary, budget and travel-docs
 * fields are populated in later stages of the concierge pipeline.
 */
public record TripPlanResult(
        TripPlanRequest request,
        FlightOption selectedFlight,
        String summary
) {
}
