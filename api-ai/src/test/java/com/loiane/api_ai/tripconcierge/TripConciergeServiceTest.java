package com.loiane.api_ai.tripconcierge;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;

import com.loiane.api_ai.tripconcierge.budget.BudgetAgentService;
import com.loiane.api_ai.tripconcierge.budget.BudgetBreakdown;
import com.loiane.api_ai.tripconcierge.docs.TravelDocsAgentService;
import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.flight.FlightSearchTools;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;
import com.loiane.api_ai.tripconcierge.itinerary.ItineraryAgentService;

import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link TripConciergeService}.
 *
 * <p>Exercises the orchestrator against mocked specialist agents, verifying:
 * <ul>
 *   <li>The parsed request is used to look up the cheapest flight, and that flight's
 *       cost/currency feed into the budget agent</li>
 *   <li>Missing dates fall back to the documented defaults</li>
 *   <li>A composed {@link TripPlanResult} carries every stage's output</li>
 *   <li>The streaming variant emits one event per stage, ending with "done"</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class TripConciergeServiceTest {

    @Mock
    private FlightSearchTools flightSearchTools;

    @Mock
    private ItineraryAgentService itineraryAgentService;

    @Mock
    private BudgetAgentService budgetAgentService;

    @Mock
    private TravelDocsAgentService travelDocsAgentService;

    private ChatClient.ChatClientRequestSpec requestSpec;
    private ChatClient.CallResponseSpec callResponseSpec;

    private TripConciergeService tripConciergeService;

    @BeforeEach
    void setUp() {
        ChatClient chatClient = mock(ChatClient.class);
        requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        callResponseSpec = mock(ChatClient.CallResponseSpec.class);

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        lenient().when(requestSpec.call()).thenReturn(callResponseSpec);

        ChatClient.Builder chatClientBuilder = mock(ChatClient.Builder.class);
        when(chatClientBuilder.defaultSystem(anyString())).thenReturn(chatClientBuilder);
        when(chatClientBuilder.build()).thenReturn(chatClient);

        tripConciergeService = new TripConciergeService(
                chatClientBuilder, flightSearchTools, itineraryAgentService, budgetAgentService, travelDocsAgentService);
    }

    private TripPlanRequest parsedRequest(LocalDate startDate, LocalDate endDate) {
        return new TripPlanRequest("NYC", "Lisbon", startDate, endDate, 2000.0, "USD", 2, "museums, food");
    }

    private FlightOption flightOption(double price) {
        return new FlightOption("SpringFly", "SF123", "NYC", "Lisbon",
                LocalDate.of(2026, 9, 1), "10:00", "22:00", price, "USD");
    }

    @Test
    void planTrip_selectsCheapestFlightAndComposesFullResult() {
        LocalDate startDate = LocalDate.of(2026, 9, 1);
        LocalDate endDate = LocalDate.of(2026, 9, 6);
        TripPlanRequest parsed = parsedRequest(startDate, endDate);
        when(callResponseSpec.entity(TripPlanRequest.class)).thenReturn(parsed);

        FlightOption cheap = flightOption(300);
        FlightOption expensive = flightOption(500);
        when(flightSearchTools.searchFlights("NYC", "Lisbon", startDate))
                .thenReturn(List.of(expensive, cheap));

        List<DayPlan> itinerary = List.of(new DayPlan(startDate, "Sunny", "Visit a museum"));
        when(itineraryAgentService.planItinerary(eq("Lisbon"), eq(startDate), eq(endDate), eq("museums, food")))
                .thenReturn(itinerary);

        BudgetBreakdown budget = new BudgetBreakdown("USD", 300, 800, 400, 300, 200, "Within budget");
        when(budgetAgentService.planBudget(eq(2000.0), eq("USD"), eq(300.0), eq("USD"), eq(startDate), eq(endDate), eq(2)))
                .thenReturn(budget);

        when(travelDocsAgentService.getEntryRequirements("Lisbon"))
                .thenReturn("No visa required for US citizens for stays under 90 days.");

        TripPlanResult result = tripConciergeService.planTrip("Plan a trip to Lisbon");

        assertThat(result.selectedFlight()).isEqualTo(cheap);
        assertThat(result.itinerary()).isEqualTo(itinerary);
        assertThat(result.budget()).isEqualTo(budget);
        assertThat(result.docsNotes()).contains("No visa required");
        assertThat(result.summary()).contains("SpringFly").contains("SF123");
    }

    @Test
    void planTrip_defaultsDatesWhenRequestOmitsThem() {
        TripPlanRequest parsed = parsedRequest(null, null);
        when(callResponseSpec.entity(TripPlanRequest.class)).thenReturn(parsed);
        when(flightSearchTools.searchFlights(anyString(), anyString(), any(LocalDate.class)))
                .thenReturn(List.of());
        when(itineraryAgentService.planItinerary(anyString(), any(LocalDate.class), any(LocalDate.class), anyString()))
                .thenReturn(List.of());
        when(budgetAgentService.planBudget(anyDouble(), anyString(), anyDouble(), anyString(), any(), any(), anyInt()))
                .thenReturn(new BudgetBreakdown("USD", 0, 0, 0, 0, 2000, "No flight found"));
        when(travelDocsAgentService.getEntryRequirements(anyString())).thenReturn("");

        TripPlanResult result = tripConciergeService.planTrip("Plan a trip");

        LocalDate expectedStart = LocalDate.now().plusMonths(1);
        LocalDate expectedEnd = expectedStart.plusDays(5);
        assertThat(result.selectedFlight()).isNull();
        assertThat(result.summary()).contains("No flight options found");

        org.mockito.Mockito.verify(itineraryAgentService)
                .planItinerary(eq("Lisbon"), eq(expectedStart), eq(expectedEnd), anyString());
    }

    @Test
    void planTripStream_emitsOneEventPerStageEndingWithDone() {
        LocalDate startDate = LocalDate.of(2026, 9, 1);
        LocalDate endDate = LocalDate.of(2026, 9, 6);
        TripPlanRequest parsed = parsedRequest(startDate, endDate);
        when(callResponseSpec.entity(TripPlanRequest.class)).thenReturn(parsed);

        FlightOption flight = flightOption(300);
        when(flightSearchTools.searchFlights("NYC", "Lisbon", startDate)).thenReturn(List.of(flight));

        List<DayPlan> itinerary = List.of(new DayPlan(startDate, "Sunny", "Visit a museum"));
        when(itineraryAgentService.planItinerary(eq("Lisbon"), eq(startDate), eq(endDate), anyString()))
                .thenReturn(itinerary);

        BudgetBreakdown budget = new BudgetBreakdown("USD", 300, 800, 400, 300, 200, "Within budget");
        when(budgetAgentService.planBudget(anyDouble(), anyString(), anyDouble(), anyString(), any(), any(), anyInt()))
                .thenReturn(budget);

        when(travelDocsAgentService.getEntryRequirements("Lisbon")).thenReturn("No visa required.");

        StepVerifier.create(tripConciergeService.planTripStream("Plan a trip to Lisbon"))
                .assertNext(event -> {
                    assertThat(event.stage()).isEqualTo("flight");
                    assertThat(event.flight()).isEqualTo(flight);
                })
                .assertNext(event -> {
                    assertThat(event.stage()).isEqualTo("itinerary");
                    assertThat(event.itinerary()).isEqualTo(itinerary);
                })
                .assertNext(event -> {
                    assertThat(event.stage()).isEqualTo("budget");
                    assertThat(event.budget()).isEqualTo(budget);
                })
                .assertNext(event -> {
                    assertThat(event.stage()).isEqualTo("docs");
                    assertThat(event.docsNotes()).isEqualTo("No visa required.");
                })
                .assertNext(event -> {
                    assertThat(event.stage()).isEqualTo("done");
                    assertThat(event.result().selectedFlight()).isEqualTo(flight);
                    assertThat(event.result().itinerary()).isEqualTo(itinerary);
                    assertThat(event.result().budget()).isEqualTo(budget);
                })
                .verifyComplete();
    }
}
