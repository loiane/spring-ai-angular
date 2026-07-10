package com.loiane.api_ai.tripconcierge.flight;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * Mock flight search tool for the Trip Concierge. There is no real flight inventory
 * in this codebase, so this generates a handful of plausible options for a given
 * route and date, deterministic on the inputs so results are stable across calls.
 */
@Component
public class FlightSearchTools {

    private static final Logger logger = LoggerFactory.getLogger(FlightSearchTools.class);

    private static final List<String> AIRLINES = List.of("SpringFly", "Aurora Air", "Meridian Airlines");

    @Tool(description = "Search for mock flight options between two cities on a given date. "
            + "Returns a few candidate flights with airline, times and price.")
    public List<FlightOption> searchFlights(
            @ToolParam(description = "Departure city or airport code") String origin,
            @ToolParam(description = "Destination city or airport code") String destination,
            @ToolParam(description = "Departure date (yyyy-MM-dd)") LocalDate departureDate) {
        logger.info("Tool call: searchFlights {} -> {} on {}", origin, destination, departureDate);

        int seed = Math.abs((origin + destination + departureDate).hashCode());
        return List.of(
                buildOption(seed, 0, origin, destination, departureDate),
                buildOption(seed, 1, origin, destination, departureDate),
                buildOption(seed, 2, origin, destination, departureDate)
        );
    }

    private FlightOption buildOption(int seed, int index, String origin, String destination, LocalDate departureDate) {
        String airline = AIRLINES.get((seed + index) % AIRLINES.size());
        String flightNumber = airline.substring(0, 2).toUpperCase() + (100 + (seed + index * 37) % 900);
        double basePrice = 180 + ((seed + index * 97) % 420);
        int departureHour = (seed + index * 5) % 20;
        int flightDurationHours = 2 + (seed + index) % 10;
        String departureTime = "%02d:00".formatted(departureHour);
        String arrivalTime = "%02d:00".formatted((departureHour + flightDurationHours) % 24);

        return new FlightOption(
                airline,
                flightNumber,
                origin,
                destination,
                departureDate,
                departureTime,
                arrivalTime,
                basePrice,
                "USD"
        );
    }
}
