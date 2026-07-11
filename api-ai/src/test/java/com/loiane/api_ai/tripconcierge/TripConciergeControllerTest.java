package com.loiane.api_ai.tripconcierge;

import java.time.LocalDate;
import java.util.List;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.loiane.api_ai.tripconcierge.budget.BudgetBreakdown;
import com.loiane.api_ai.tripconcierge.flight.FlightOption;
import com.loiane.api_ai.tripconcierge.itinerary.DayPlan;

import reactor.core.publisher.Flux;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link TripConciergeController}.
 */
@ExtendWith(MockitoExtension.class)
class TripConciergeControllerTest {

    @Mock
    private TripConciergeService tripConciergeService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        TripConciergeController controller = new TripConciergeController(tripConciergeService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    private TripPlanRequest sampleRequest() {
        return new TripPlanRequest("NYC", "Lisbon", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 6),
                2000.0, "USD", 2, "museums, food");
    }

    private FlightOption sampleFlight() {
        return new FlightOption("SpringFly", "SF123", "NYC", "Lisbon",
                LocalDate.of(2026, 9, 1), "10:00", "22:00", 300, "USD");
    }

    @Test
    void plan_shouldReturnComposedTripPlanResult() throws Exception {
        TripConciergeRequest request = new TripConciergeRequest("Plan a trip to Lisbon");
        TripPlanResult result = new TripPlanResult(
                sampleRequest(), sampleFlight(),
                List.of(new DayPlan(LocalDate.of(2026, 9, 1), "Sunny", "Visit a museum")),
                new BudgetBreakdown("USD", 300, 800, 400, 300, 200, "Within budget"),
                "No visa required.",
                "SpringFly SF123 from NYC to Lisbon");

        when(tripConciergeService.planTrip(request.message())).thenReturn(result);

        mockMvc.perform(post("/api/trip/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedFlight.flightNumber").value("SF123"))
                .andExpect(jsonPath("$.budget.currency").value("USD"))
                .andExpect(jsonPath("$.docsNotes").value("No visa required."));
    }

    @Test
    void plan_shouldReturnInternalServerErrorWhenServiceFails() throws Exception {
        TripConciergeRequest request = new TripConciergeRequest("Plan a trip to Lisbon");
        when(tripConciergeService.planTrip(anyString())).thenThrow(new RuntimeException("AI unavailable"));

        mockMvc.perform(post("/api/trip/plan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void planStream_shouldReturnStagedEvents() throws Exception {
        TripConciergeRequest request = new TripConciergeRequest("Plan a trip to Lisbon");
        FlightOption flight = sampleFlight();

        when(tripConciergeService.planTripStream(request.message()))
                .thenReturn(Flux.just(TripPlanStreamEvent.flight(flight)));

        mockMvc.perform(post("/api/trip/plan/stream")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
