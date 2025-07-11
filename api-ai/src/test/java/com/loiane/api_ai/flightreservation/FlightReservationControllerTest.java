package com.loiane.api_ai.flightreservation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for FlightReservationController
 */
@ExtendWith(MockitoExtension.class)
class FlightReservationControllerTest {

    @Mock
    private FlightReservationService flightReservationService;

    private FlightReservationController flightReservationController;
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private FlightReservation sampleReservation;

    @BeforeEach
    void setUp() {
        flightReservationController = new FlightReservationController(flightReservationService);
        mockMvc = MockMvcBuilders.standaloneSetup(flightReservationController).build();
        objectMapper = new ObjectMapper();

        sampleReservation = new FlightReservation(
            "FR-12345678",
            "AA101",
            "John",
            "Doe",
            "john.doe@email.com",
            "JFK",
            "LAX",
            "12A",
            FlightClass.ECONOMY,
            ReservationStatus.CONFIRMED,
            LocalDateTime.now(),
            LocalDateTime.now()
        );
    }

    @Test
    void testGetAllReservations_ShouldReturnOkWithReservationList() throws Exception {
        // Given
        List<FlightReservation> reservations = Arrays.asList(sampleReservation);
        when(flightReservationService.getAllReservations()).thenReturn(reservations);

        // When & Then
        mockMvc.perform(get("/api/flight-reservations"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].reservationId").value("FR-12345678"))
                .andExpect(jsonPath("$[0].flightNumber").value("AA101"))
                .andExpect(jsonPath("$[0].passengerFirstName").value("John"))
                .andExpect(jsonPath("$[0].passengerLastName").value("Doe"));

        verify(flightReservationService, times(1)).getAllReservations();
    }

    @Test
    void testGetAllReservations_WhenServiceThrowsException_ShouldReturnInternalServerError() throws Exception {
        // Given
        when(flightReservationService.getAllReservations()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(get("/api/flight-reservations"))
                .andDo(print())
                .andExpect(status().isInternalServerError());

        verify(flightReservationService, times(1)).getAllReservations();
    }

    @Test
    void testGetReservation_WhenFound_ShouldReturnOkWithReservation() throws Exception {
        // Given
        String reservationId = "FR-12345678";
        when(flightReservationService.getReservationById(reservationId)).thenReturn(Optional.of(sampleReservation));

        // When & Then
        mockMvc.perform(get("/api/flight-reservations/{reservationId}", reservationId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reservationId").value(reservationId))
                .andExpect(jsonPath("$.flightNumber").value("AA101"));

        verify(flightReservationService, times(1)).getReservationById(reservationId);
    }

    @Test
    void testGetReservation_WhenNotFound_ShouldReturnNotFound() throws Exception {
        // Given
        String reservationId = "FR-NOTFOUND";
        when(flightReservationService.getReservationById(reservationId)).thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(get("/api/flight-reservations/{reservationId}", reservationId))
                .andDo(print())
                .andExpect(status().isNotFound());

        verify(flightReservationService, times(1)).getReservationById(reservationId);
    }

    @Test
    void testCreateReservation_WithValidRequest_ShouldReturnCreatedWithReservation() throws Exception {
        // Given
        CreateReservationRequest request = new CreateReservationRequest(
            "UA205", "Jane", "Smith", "jane.smith@email.com",
            "ORD", "SFO", "8F", FlightClass.BUSINESS
        );

        FlightReservation createdReservation = new FlightReservation(
            "FR-87654321", "UA205", "Jane", "Smith", "jane.smith@email.com",
            "ORD", "SFO", "8F", FlightClass.BUSINESS, ReservationStatus.CONFIRMED,
            LocalDateTime.now(), LocalDateTime.now()
        );

        when(flightReservationService.createReservation(any(FlightReservation.class))).thenReturn(createdReservation);

        // When & Then
        mockMvc.perform(post("/api/flight-reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reservationId").value("FR-87654321"))
                .andExpect(jsonPath("$.flightNumber").value("UA205"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(flightReservationService, times(1)).createReservation(any(FlightReservation.class));
    }

    @Test
    void testCreateReservation_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given
        CreateReservationRequest request = new CreateReservationRequest(
            "", "Jane", "Smith", "jane.smith@email.com",
            "ORD", "SFO", "8F", FlightClass.BUSINESS
        );

        when(flightReservationService.createReservation(any(FlightReservation.class)))
                .thenThrow(new FlightReservationException("Flight number cannot be empty"));

        // When & Then
        mockMvc.perform(post("/api/flight-reservations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isBadRequest());

        verify(flightReservationService, times(1)).createReservation(any(FlightReservation.class));
    }

    @Test
    void testCancelReservation_WhenSuccessful_ShouldReturnOkWithCancelledReservation() throws Exception {
        // Given
        String reservationId = "FR-12345678";
        FlightReservation cancelledReservation = new FlightReservation(
            sampleReservation.reservationId(),
            sampleReservation.flightNumber(),
            sampleReservation.passengerFirstName(),
            sampleReservation.passengerLastName(),
            sampleReservation.passengerEmail(),
            sampleReservation.departureAirport(),
            sampleReservation.arrivalAirport(),
            sampleReservation.seatNumber(),
            sampleReservation.flightClass(),
            ReservationStatus.CANCELLED,
            sampleReservation.createdAt(),
            LocalDateTime.now()
        );

        when(flightReservationService.cancelReservation(reservationId)).thenReturn(cancelledReservation);

        // When & Then
        mockMvc.perform(put("/api/flight-reservations/{reservationId}/cancel", reservationId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reservationId").value(reservationId))
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(flightReservationService, times(1)).cancelReservation(reservationId);
    }

    @Test
    void testCancelReservation_WhenNotFound_ShouldReturnNotFound() throws Exception {
        // Given
        String reservationId = "FR-NOTFOUND";
        when(flightReservationService.cancelReservation(reservationId))
                .thenThrow(new FlightReservationNotFoundException("Flight reservation not found"));

        // When & Then
        mockMvc.perform(put("/api/flight-reservations/{reservationId}/cancel", reservationId))
                .andDo(print())
                .andExpect(status().isNotFound());

        verify(flightReservationService, times(1)).cancelReservation(reservationId);
    }

    @Test
    void testCancelReservation_WhenAlreadyCancelled_ShouldReturnBadRequest() throws Exception {
        // Given
        String reservationId = "FR-12345678";
        when(flightReservationService.cancelReservation(reservationId))
                .thenThrow(new FlightReservationException("Reservation is already cancelled"));

        // When & Then
        mockMvc.perform(put("/api/flight-reservations/{reservationId}/cancel", reservationId))
                .andDo(print())
                .andExpect(status().isBadRequest());

        verify(flightReservationService, times(1)).cancelReservation(reservationId);
    }

    @ParameterizedTest
    @EnumSource(ReservationStatus.class)
    void testUpdateReservationStatus_WithValidStatus_ShouldReturnOk(ReservationStatus newStatus) throws Exception {
        // Given
        String reservationId = "FR-12345678";
        UpdateStatusRequest request = new UpdateStatusRequest(newStatus);
        
        FlightReservation updatedReservation = new FlightReservation(
            sampleReservation.reservationId(),
            sampleReservation.flightNumber(),
            sampleReservation.passengerFirstName(),
            sampleReservation.passengerLastName(),
            sampleReservation.passengerEmail(),
            sampleReservation.departureAirport(),
            sampleReservation.arrivalAirport(),
            sampleReservation.seatNumber(),
            sampleReservation.flightClass(),
            newStatus,
            sampleReservation.createdAt(),
            LocalDateTime.now()
        );

        when(flightReservationService.updateReservationStatus(reservationId, newStatus))
                .thenReturn(updatedReservation);

        // When & Then
        mockMvc.perform(put("/api/flight-reservations/{reservationId}/status", reservationId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reservationId").value(reservationId))
                .andExpect(jsonPath("$.status").value(newStatus.name()));

        verify(flightReservationService, times(1)).updateReservationStatus(reservationId, newStatus);
    }

    @Test
    void testGetReservationsByEmail_ShouldReturnOkWithReservationList() throws Exception {
        // Given
        String email = "john.doe@email.com";
        List<FlightReservation> reservations = Arrays.asList(sampleReservation);
        when(flightReservationService.getReservationsByEmail(email)).thenReturn(reservations);

        // When & Then
        mockMvc.perform(get("/api/flight-reservations/search")
                .param("email", email))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].passengerEmail").value(email));

        verify(flightReservationService, times(1)).getReservationsByEmail(email);
    }

    @Test
    void testControllerHasProperAnnotations() {
        // Verify that the controller class has proper Spring annotations
        org.springframework.web.bind.annotation.RestController restControllerAnnotation = 
            FlightReservationController.class.getAnnotation(org.springframework.web.bind.annotation.RestController.class);
        org.springframework.web.bind.annotation.RequestMapping requestMappingAnnotation = 
            FlightReservationController.class.getAnnotation(org.springframework.web.bind.annotation.RequestMapping.class);

        assertThat(restControllerAnnotation).isNotNull();
        assertThat(requestMappingAnnotation).isNotNull();
        assertThat(requestMappingAnnotation.value()).containsExactly("/api/flight-reservations");
    }
}
