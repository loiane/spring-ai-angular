package com.loiane.api_ai.tripconcierge.itinerary;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * Weather forecast tool for the itinerary agent, backed by the free Open-Meteo API.
 * Open-Meteo only forecasts about 16 days out, so trip dates further in the future
 * will return an empty list; the agent falls back to general climate knowledge in that case.
 */
@Component
public class WeatherTools {

    private static final Logger logger = LoggerFactory.getLogger(WeatherTools.class);

    private final WeatherClient weatherClient;

    public WeatherTools(WeatherClient weatherClient) {
        this.weatherClient = weatherClient;
    }

    @Tool(description = "Get the daily weather forecast for a city between two dates. "
            + "Returns an empty list if the dates are too far in the future for a forecast to exist; "
            + "in that case rely on general seasonal/climate knowledge instead.")
    public List<DailyForecast> getForecast(
            @ToolParam(description = "City name") String city,
            @ToolParam(description = "Start date (yyyy-MM-dd)") LocalDate startDate,
            @ToolParam(description = "End date (yyyy-MM-dd)") LocalDate endDate) {
        logger.info("Tool call: getForecast {} from {} to {}", city, startDate, endDate);

        GeocodingResult location = weatherClient.geocode(city);
        if (location == null) {
            return List.of();
        }

        return weatherClient.getForecast(location.latitude(), location.longitude(), startDate, endDate);
    }
}
