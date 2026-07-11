package com.loiane.api_ai.tripconcierge;

import java.util.List;

import com.loiane.api_ai.tripconcierge.budget.BudgetBreakdown;
import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;

/**
 * The composed result of a trip planning request.
 */
public record TripPlanResult(
        TripPlanRequest request,
        FlightOption selectedFlight,
        List<DayPlan> itinerary,
        BudgetBreakdown budget,
        String docsNotes,
        String summary
) {
}
