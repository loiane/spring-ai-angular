package com.loiane.api_ai.tripconcierge.itinerary;

/**
 * Latitude/longitude resolved from a city name via the Open-Meteo geocoding API.
 */
public record GeocodingResult(double latitude, double longitude, String resolvedName) {
}
