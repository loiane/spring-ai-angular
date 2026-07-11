package com.loiane.api_ai.tripconcierge;

import java.util.List;

import com.loiane.api_ai.tripconcierge.budget.BudgetBreakdown;
import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;

/**
 * A single staged event emitted while planning a trip. Each event carries the
 * result of exactly one specialist agent finishing its work; only the field
 * matching {@code stage} is populated.
 *
 * @param stage    one of "flight", "itinerary", "budget", "docs", "done"
 * @param flight   populated when stage is "flight"
 * @param itinerary populated when stage is "itinerary" (rendered as a single string summary)
 * @param budget   populated when stage is "budget"
 * @param docsNotes populated when stage is "docs"
 * @param result   populated when stage is "done", the full composed plan
 * @param error    populated when stage is "error", a message describing which stage failed
 */
public record TripPlanStreamEvent(
        String stage,
        FlightOption flight,
        List<DayPlan> itinerary,
        BudgetBreakdown budget,
        String docsNotes,
        TripPlanResult result,
        String error
) {
    public static TripPlanStreamEvent flight(FlightOption flight) {
        return new TripPlanStreamEvent("flight", flight, null, null, null, null, null);
    }

    public static TripPlanStreamEvent itinerary(List<DayPlan> itinerary) {
        return new TripPlanStreamEvent("itinerary", null, itinerary, null, null, null, null);
    }

    public static TripPlanStreamEvent budget(BudgetBreakdown budget) {
        return new TripPlanStreamEvent("budget", null, null, budget, null, null, null);
    }

    public static TripPlanStreamEvent docs(String docsNotes) {
        return new TripPlanStreamEvent("docs", null, null, null, docsNotes, null, null);
    }

    public static TripPlanStreamEvent done(TripPlanResult result) {
        return new TripPlanStreamEvent("done", null, null, null, null, result, null);
    }

    public static TripPlanStreamEvent error(String stage, String message) {
        return new TripPlanStreamEvent(stage, null, null, null, null, null, message);
    }
}
