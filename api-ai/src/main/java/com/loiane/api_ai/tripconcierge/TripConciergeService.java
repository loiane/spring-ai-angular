package com.loiane.api_ai.tripconcierge;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import com.loiane.api_ai.tripconcierge.budget.BudgetAgentService;
import com.loiane.api_ai.tripconcierge.budget.BudgetBreakdown;
import com.loiane.api_ai.tripconcierge.docs.TravelDocsAgentService;
import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.flight.FlightSearchTools;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;
import com.loiane.api_ai.tripconcierge.itinerary.ItineraryAgentService;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

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
    private final BudgetAgentService budgetAgentService;
    private final TravelDocsAgentService travelDocsAgentService;

    public TripConciergeService(ChatClient.Builder chatClientBuilder, FlightSearchTools flightSearchTools,
            ItineraryAgentService itineraryAgentService, BudgetAgentService budgetAgentService,
            TravelDocsAgentService travelDocsAgentService) {
        this.parsingChatClient = chatClientBuilder
                .defaultSystem(PARSE_SYSTEM_PROMPT)
                .build();
        this.flightSearchTools = flightSearchTools;
        this.itineraryAgentService = itineraryAgentService;
        this.budgetAgentService = budgetAgentService;
        this.travelDocsAgentService = travelDocsAgentService;
    }

    public TripPlanResult planTrip(String message) {
        logger.info("Planning trip from request: {}", message);

        TripPlanRequest request = parseRequest(message);
        LocalDate startDate = request.startDate() != null ? request.startDate() : LocalDate.now().plusMonths(1);
        LocalDate endDate = request.endDate() != null ? request.endDate() : startDate.plusDays(5);

        FlightOption selectedFlight = findBestFlight(request, startDate);
        List<DayPlan> itinerary = itineraryAgentService.planItinerary(
                request.destination(), startDate, endDate, request.interests());
        BudgetBreakdown budget = planBudget(request, selectedFlight, startDate, endDate);
        String docsNotes = travelDocsAgentService.getEntryRequirements(request.destination());
        String summary = buildSummary(request, selectedFlight);

        return new TripPlanResult(request, selectedFlight, itinerary, budget, docsNotes, summary);
    }

    public Flux<TripPlanStreamEvent> planTripStream(String message) {
        logger.info("Planning trip (streaming) from request: {}", message);

        TripPlanRequest request = parseRequest(message);
        LocalDate startDate = request.startDate() != null ? request.startDate() : LocalDate.now().plusMonths(1);
        LocalDate endDate = request.endDate() != null ? request.endDate() : startDate.plusDays(5);

        AtomicReference<FlightOption> flightRef = new AtomicReference<>();
        AtomicReference<List<DayPlan>> itineraryRef = new AtomicReference<>();
        AtomicReference<BudgetBreakdown> budgetRef = new AtomicReference<>();
        AtomicReference<String> docsRef = new AtomicReference<>();

        Mono<TripPlanStreamEvent> flightEvent = Mono.fromCallable(() -> findBestFlight(request, startDate))
                .doOnNext(flightRef::set)
                .map(TripPlanStreamEvent::flight)
                .subscribeOn(Schedulers.boundedElastic());

        Mono<TripPlanStreamEvent> itineraryEvent = Mono.fromCallable(() -> itineraryAgentService.planItinerary(
                        request.destination(), startDate, endDate, request.interests()))
                .doOnNext(itineraryRef::set)
                .map(TripPlanStreamEvent::itinerary)
                .subscribeOn(Schedulers.boundedElastic());

        Mono<TripPlanStreamEvent> budgetEvent = Mono.fromCallable(() -> planBudget(request, flightRef.get(), startDate, endDate))
                .doOnNext(budgetRef::set)
                .map(TripPlanStreamEvent::budget)
                .subscribeOn(Schedulers.boundedElastic());

        Mono<TripPlanStreamEvent> docsEvent = Mono.fromCallable(() -> travelDocsAgentService.getEntryRequirements(request.destination()))
                .doOnNext(docsRef::set)
                .map(TripPlanStreamEvent::docs)
                .subscribeOn(Schedulers.boundedElastic());

        Mono<TripPlanStreamEvent> doneEvent = Mono.fromCallable(() -> {
            String summary = buildSummary(request, flightRef.get());
            TripPlanResult result = new TripPlanResult(
                    request, flightRef.get(), itineraryRef.get(), budgetRef.get(), docsRef.get(), summary);
            return TripPlanStreamEvent.done(result);
        });

        return Flux.concat(flightEvent, itineraryEvent, budgetEvent, docsEvent, doneEvent);
    }

    private TripPlanRequest parseRequest(String message) {
        return parsingChatClient.prompt()
                .user(message)
                .call()
                .entity(TripPlanRequest.class);
    }

    private FlightOption findBestFlight(TripPlanRequest request, LocalDate departureDate) {
        List<FlightOption> options = flightSearchTools.searchFlights(
                request.origin(), request.destination(), departureDate);

        return options.stream()
                .min(Comparator.comparingDouble(FlightOption::price))
                .orElse(null);
    }

    private BudgetBreakdown planBudget(TripPlanRequest request, FlightOption flight, LocalDate startDate, LocalDate endDate) {
        double flightCost = flight != null ? flight.price() : 0;
        String flightCurrency = flight != null ? flight.currency() : request.budgetCurrency();

        return budgetAgentService.planBudget(
                request.budget(), request.budgetCurrency(), flightCost, flightCurrency,
                startDate, endDate, request.travelers());
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
