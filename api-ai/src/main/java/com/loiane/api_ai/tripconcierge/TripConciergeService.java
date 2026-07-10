package com.loiane.api_ai.tripconcierge;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.flight.FlightSearchTools;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;
import com.loiane.api_ai.tripconcierge.itinerary.ItineraryAgentService;

/**
 * Orchestrator for the Trip Planning Concierge. Parses a free-text trip request into
 * structured form, then coordinates specialist agents (flight, itinerary, budget,
 * travel-docs) to build a full trip plan.
 */
@Service
public class TripConciergeService {

    private static final Logger logger = LoggerFactory.getLogger(TripConciergeService.class);

    private static final String PARSE_SYSTEM_PROMPT = """
            You extract structured trip planning details from a traveler's request.
            Infer reasonable defaults when details are missing: if no origin is given,
            leave it blank; if no dates are given, assume a trip starting one month
            from today lasting 5 days; if no budget is given, use 1500 USD; if no
            traveler count is given, assume 1.
            """;

    private final ChatClient parsingChatClient;
    private final FlightSearchTools flightSearchTools;
    private final ItineraryAgentService itineraryAgentService;

    public TripConciergeService(ChatClient.Builder chatClientBuilder, FlightSearchTools flightSearchTools,
            ItineraryAgentService itineraryAgentService) {
        this.parsingChatClient = chatClientBuilder
                .defaultSystem(PARSE_SYSTEM_PROMPT)
                .build();
        this.flightSearchTools = flightSearchTools;
        this.itineraryAgentService = itineraryAgentService;
    }

    public TripPlanResult planTrip(String message) {
        logger.info("Planning trip from request: {}", message);

        TripPlanRequest request = parseRequest(message);
        FlightOption selectedFlight = findBestFlight(request);
        List<DayPlan> itinerary = planItinerary(request);
        String summary = buildSummary(request, selectedFlight);

        return new TripPlanResult(request, selectedFlight, itinerary, summary);
    }

    private TripPlanRequest parseRequest(String message) {
        return parsingChatClient.prompt()
                .user(message)
                .call()
                .entity(TripPlanRequest.class);
    }

    private FlightOption findBestFlight(TripPlanRequest request) {
        LocalDate departureDate = request.startDate() != null ? request.startDate() : LocalDate.now().plusMonths(1);
        List<FlightOption> options = flightSearchTools.searchFlights(
                request.origin(), request.destination(), departureDate);

        return options.stream()
                .min(Comparator.comparingDouble(FlightOption::price))
                .orElse(null);
    }

    private List<DayPlan> planItinerary(TripPlanRequest request) {
        LocalDate startDate = request.startDate() != null ? request.startDate() : LocalDate.now().plusMonths(1);
        LocalDate endDate = request.endDate() != null ? request.endDate() : startDate.plusDays(5);

        return itineraryAgentService.planItinerary(request.destination(), startDate, endDate, request.interests());
    }

    private String buildSummary(TripPlanRequest request, FlightOption flight) {
        if (flight == null) {
            return "No flight options found for %s to %s.".formatted(request.origin(), request.destination());
        }
        return "%s %s from %s to %s on %s, departing %s, arriving %s ($%.2f %s)".formatted(
                flight.airline(), flight.flightNumber(), flight.origin(), flight.destination(),
                flight.departureDate(), flight.departureTime(), flight.arrivalTime(),
                flight.price(), flight.currency());
    }
}
