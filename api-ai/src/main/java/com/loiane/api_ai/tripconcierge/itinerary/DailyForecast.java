package com.loiane.api_ai.tripconcierge.itinerary;

import java.time.LocalDate;

/**
 * A single day's forecast, in Celsius, with a short human-readable condition.
 */
public record DailyForecast(LocalDate date, double minTempC, double maxTempC, String condition) {
}
