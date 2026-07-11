package com.loiane.api_ai.tripconcierge.itinerary;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.stereotype.Service;

/**
 * Itinerary planning agent. Uses the weather forecast tool to ground its
 * day-by-day suggestions in real (or, for far-future dates, seasonal) conditions.
 */
@Service
public class ItineraryAgentService {

    private static final Logger logger = LoggerFactory.getLogger(ItineraryAgentService.class);

    private static final String SYSTEM_PROMPT = """
            You are a travel itinerary planner. Given a destination, a date range and
            the traveler's interests, produce a day-by-day plan.

            Use the getForecast tool to check the weather for the trip dates. If the
            tool returns no data (dates too far in the future), rely on general
            seasonal/climate knowledge for the destination and month instead, and say
            so in the weather summary.

            For each day, suggest activities that fit the weather and the traveler's
            stated interests. Keep each day's activity suggestions concise (1-3 short
            sentences).
            """;

    private static final PromptTemplate PLAN_PROMPT = new PromptTemplate("""
            Plan a day-by-day itinerary for a trip to {destination} from {startDate} to {endDate}.
            Traveler interests: {interests}
            """);

    private final ChatClient chatClient;

    public ItineraryAgentService(ChatClient.Builder chatClientBuilder, WeatherTools weatherTools) {
        this.chatClient = chatClientBuilder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultTools(weatherTools)
                .build();
    }

    public List<DayPlan> planItinerary(String destination, LocalDate startDate, LocalDate endDate, String interests) {
        logger.info("Planning itinerary for {} from {} to {}", destination, startDate, endDate);

        String prompt = PLAN_PROMPT.render(Map.of(
                "destination", destination,
                "startDate", startDate,
                "endDate", endDate,
                "interests", interests == null || interests.isBlank() ? "general sightseeing" : interests
        ));

        ItineraryPlan plan = chatClient.prompt()
                .user(prompt)
                .call()
                .entity(ItineraryPlan.class);
        return plan == null ? List.of() : plan.days();
    }
}
