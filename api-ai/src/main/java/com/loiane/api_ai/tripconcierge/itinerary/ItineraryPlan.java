package com.loiane.api_ai.tripconcierge.itinerary;

import java.util.List;

/**
 * Wrapper for the itinerary agent's structured output. Requesting a top-level
 * JSON object (rather than a bare array) from the model is more reliable with
 * tool-calling chat models, which tend to wrap arrays in an object regardless
 * of the requested schema.
 */
public record ItineraryPlan(List<DayPlan> days) {
}
