package com.loiane.api_ai.tripconcierge.itinerary;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Client for the free, no-API-key Open-Meteo geocoding and forecast APIs.
 */
@Component
public class WeatherClient {

    private static final Logger logger = LoggerFactory.getLogger(WeatherClient.class);

    private static final List<String> WMO_CONDITIONS = List.of(
            "Clear sky", "Mainly clear", "Partly cloudy", "Overcast",
            "Fog", "Depositing rime fog",
            "Light drizzle", "Moderate drizzle", "Dense drizzle",
            "Light freezing drizzle", "Dense freezing drizzle",
            "Slight rain", "Moderate rain", "Heavy rain",
            "Light freezing rain", "Heavy freezing rain",
            "Slight snow fall", "Moderate snow fall", "Heavy snow fall",
            "Snow grains",
            "Slight rain showers", "Moderate rain showers", "Violent rain showers",
            "Slight snow showers", "Heavy snow showers",
            "Thunderstorm", "Thunderstorm with slight hail", "Thunderstorm with heavy hail"
    );

    private final RestClient geocodingClient = RestClient.create("https://geocoding-api.open-meteo.com");
    private final RestClient forecastClient = RestClient.create("https://api.open-meteo.com");

    private static final ParameterizedTypeReference<Map<String, Object>> JSON_MAP =
            new ParameterizedTypeReference<>() { };

    public GeocodingResult geocode(String city) {
        logger.info("Geocoding city: {}", city);
        Map<String, Object> response = geocodingClient.get()
                .uri(uriBuilder -> uriBuilder.path("/v1/search")
                        .queryParam("name", city)
                        .queryParam("count", 1)
                        .build())
                .retrieve()
                .body(JSON_MAP);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = response == null ? List.of() : (List<Map<String, Object>>) response.get("results");
        if (results == null || results.isEmpty()) {
            logger.warn("No geocoding results for city: {}", city);
            return null;
        }

        Map<String, Object> first = results.get(0);
        return new GeocodingResult(
                ((Number) first.get("latitude")).doubleValue(),
                ((Number) first.get("longitude")).doubleValue(),
                String.valueOf(first.get("name"))
        );
    }

    public List<DailyForecast> getForecast(double latitude, double longitude, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching forecast for ({}, {}) from {} to {}", latitude, longitude, startDate, endDate);

        Map<String, Object> response;
        try {
            response = forecastClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/v1/forecast")
                            .queryParam("latitude", latitude)
                            .queryParam("longitude", longitude)
                            .queryParam("daily", "temperature_2m_max,temperature_2m_min,weather_code")
                            .queryParam("timezone", "auto")
                            .queryParam("start_date", startDate)
                            .queryParam("end_date", endDate)
                            .build())
                    .retrieve()
                    .body(JSON_MAP);
        } catch (RestClientResponseException e) {
            logger.warn("Forecast unavailable for {} to {}: {}", startDate, endDate, e.getResponseBodyAsString());
            return List.of();
        }

        if (response == null || response.get("daily") == null) {
            return List.of();
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> daily = (Map<String, Object>) response.get("daily");
        @SuppressWarnings("unchecked")
        List<String> dates = (List<String>) daily.get("time");
        @SuppressWarnings("unchecked")
        List<Number> maxTemps = (List<Number>) daily.get("temperature_2m_max");
        @SuppressWarnings("unchecked")
        List<Number> minTemps = (List<Number>) daily.get("temperature_2m_min");
        @SuppressWarnings("unchecked")
        List<Number> weatherCodes = (List<Number>) daily.get("weather_code");

        return java.util.stream.IntStream.range(0, dates.size())
                .mapToObj(i -> new DailyForecast(
                        LocalDate.parse(dates.get(i)),
                        minTemps.get(i).doubleValue(),
                        maxTemps.get(i).doubleValue(),
                        describeCondition(weatherCodes.get(i).intValue())
                ))
                .toList();
    }

    private String describeCondition(int code) {
        return switch (code) {
            case 0 -> WMO_CONDITIONS.get(0);
            case 1 -> WMO_CONDITIONS.get(1);
            case 2 -> WMO_CONDITIONS.get(2);
            case 3 -> WMO_CONDITIONS.get(3);
            case 45 -> WMO_CONDITIONS.get(4);
            case 48 -> WMO_CONDITIONS.get(5);
            case 51 -> WMO_CONDITIONS.get(6);
            case 53 -> WMO_CONDITIONS.get(7);
            case 55 -> WMO_CONDITIONS.get(8);
            case 56 -> WMO_CONDITIONS.get(9);
            case 57 -> WMO_CONDITIONS.get(10);
            case 61 -> WMO_CONDITIONS.get(11);
            case 63 -> WMO_CONDITIONS.get(12);
            case 65 -> WMO_CONDITIONS.get(13);
            case 66 -> WMO_CONDITIONS.get(14);
            case 67 -> WMO_CONDITIONS.get(15);
            case 71 -> WMO_CONDITIONS.get(16);
            case 73 -> WMO_CONDITIONS.get(17);
            case 75 -> WMO_CONDITIONS.get(18);
            case 77 -> WMO_CONDITIONS.get(19);
            case 80 -> WMO_CONDITIONS.get(20);
            case 81 -> WMO_CONDITIONS.get(21);
            case 82 -> WMO_CONDITIONS.get(22);
            case 85 -> WMO_CONDITIONS.get(23);
            case 86 -> WMO_CONDITIONS.get(24);
            case 95 -> WMO_CONDITIONS.get(25);
            case 96 -> WMO_CONDITIONS.get(26);
            case 99 -> WMO_CONDITIONS.get(27);
            default -> "Unknown";
        };
    }
}
