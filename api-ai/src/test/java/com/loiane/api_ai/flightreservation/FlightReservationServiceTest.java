package com.loiane.api_ai.flightreservation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FlightReservationService
 * 
 * This test class verifies the functionality of FlightReservationService including:
 * - CRUD operations for flight reservations
 * - Business logic validation
 * - Error handling scenarios
 * - Status management
 */
@ExtendWith(MockitoExtension.class)
class FlightReservationServiceTest {

    @Mock
    private FlightReservationRepository flightReservationRepository;

    private FlightReservationService flightReservationService;

    private FlightReservation sampleReservation;

    @BeforeEach
    void setUp() {
        flightReservationService = new FlightReservationService(flightReservationRepository);
        
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
    void testConstructor_WithNullRepository_ShouldThrowException() {
        // When & Then
        assertThatThrownBy(() -> new FlightReservationService(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("FlightReservationRepository cannot be null");
    }

    @Test
    void testGetAllReservations_WhenSuccessful_ShouldReturnList() {
        // Given
        List<FlightReservation> expectedReservations = Arrays.asList(sampleReservation);
        when(flightReservationRepository.findAll()).thenReturn(expectedReservations);

        // When
        List<FlightReservation> actualReservations = flightReservationService.getAllReservations();

        // Then
        assertThat(actualReservations).isNotNull();
        assertThat(actualReservations).hasSize(1);
        assertThat(actualReservations.get(0)).isEqualTo(sampleReservation);
        verify(flightReservationRepository, times(1)).findAll();
    }

    @Test
    void testGetAllReservations_WhenRepositoryThrowsException_ShouldThrowFlightReservationException() {
        // Given
        when(flightReservationRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // When & Then
        assertThatThrownBy(() -> flightReservationService.getAllReservations())
                .isInstanceOf(FlightReservationException.class)
                .hasMessageContaining("Failed to retrieve flight reservations");
    }

    @Test
    void testGetReservationById_WhenFound_ShouldReturnReservation() {
        // Given
        String reservationId = "FR-12345678";
        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.of(sampleReservation));

        // When
        Optional<FlightReservation> result = flightReservationService.getReservationById(reservationId);

        // Then
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(sampleReservation);
        verify(flightReservationRepository, times(1)).findById(reservationId);
    }

    @Test
    void testGetReservationById_WhenNotFound_ShouldReturnEmpty() {
        // Given
        String reservationId = "FR-NOTFOUND";
        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.empty());

        // When
        Optional<FlightReservation> result = flightReservationService.getReservationById(reservationId);

        // Then
        assertThat(result).isEmpty();
        verify(flightReservationRepository, times(1)).findById(reservationId);
    }

    @Test
    void testGetReservationById_WithNullId_ShouldThrowException() {
        // When & Then
        assertThatThrownBy(() -> flightReservationService.getReservationById(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Reservation ID cannot be null");
    }

    @Test
    void testCreateReservation_WithValidData_ShouldReturnSavedReservation() {
        // Given
        FlightReservation newReservation = new FlightReservation(
            null, "UA205", "Jane", "Smith", "jane.smith@email.com",
            "ORD", "SFO", "8F", FlightClass.BUSINESS, ReservationStatus.CONFIRMED, null, null
        );
        
        when(flightReservationRepository.save(any(FlightReservation.class))).thenReturn(sampleReservation);

        // When
        FlightReservation result = flightReservationService.createReservation(newReservation);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(sampleReservation);
        verify(flightReservationRepository, times(1)).save(any(FlightReservation.class));
    }

    @Test
    void testCreateReservation_WithNullReservation_ShouldThrowException() {
        // When & Then
        assertThatThrownBy(() -> flightReservationService.createReservation(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Flight reservation cannot be null");
    }

    @Test
    void testCreateReservation_WithInvalidData_ShouldThrowValidationException() {
        // Given - reservation with empty flight number
        FlightReservation invalidReservation = new FlightReservation(
            null, "", "Jane", "Smith", "jane.smith@email.com",
            "ORD", "SFO", "8F", FlightClass.BUSINESS, ReservationStatus.CONFIRMED, null, null
        );

        // When & Then
        assertThatThrownBy(() -> flightReservationService.createReservation(invalidReservation))
                .isInstanceOf(FlightReservationException.class)
                .hasMessageContaining("Flight number cannot be empty");
    }

    @Test
    void testCancelReservation_WithValidId_ShouldReturnCancelledReservation() {
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

        when(flightReservationRepository.findById(reservationId))
            .thenReturn(Optional.of(sampleReservation))
            .thenReturn(Optional.of(cancelledReservation));
        when(flightReservationRepository.updateStatus(reservationId, ReservationStatus.CANCELLED))
            .thenReturn(true);

        // When
        FlightReservation result = flightReservationService.cancelReservation(reservationId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo(ReservationStatus.CANCELLED);
        verify(flightReservationRepository, times(1)).updateStatus(reservationId, ReservationStatus.CANCELLED);
    }

    @Test
    void testCancelReservation_WithNonExistentId_ShouldThrowNotFoundException() {
        // Given
        String reservationId = "FR-NOTFOUND";
        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> flightReservationService.cancelReservation(reservationId))
                .isInstanceOf(FlightReservationNotFoundException.class)
                .hasMessageContaining("Flight reservation not found: " + reservationId);
    }

    @Test
    void testCancelReservation_WhenAlreadyCancelled_ShouldThrowException() {
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
            sampleReservation.updatedAt()
        );

        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.of(cancelledReservation));

        // When & Then
        assertThatThrownBy(() -> flightReservationService.cancelReservation(reservationId))
                .isInstanceOf(FlightReservationException.class)
                .hasMessageContaining("Reservation is already cancelled");
    }

    @Test
    void testCancelReservation_WhenCompleted_ShouldThrowException() {
        // Given
        String reservationId = "FR-12345678";
        FlightReservation completedReservation = new FlightReservation(
            sampleReservation.reservationId(),
            sampleReservation.flightNumber(),
            sampleReservation.passengerFirstName(),
            sampleReservation.passengerLastName(),
            sampleReservation.passengerEmail(),
            sampleReservation.departureAirport(),
            sampleReservation.arrivalAirport(),
            sampleReservation.seatNumber(),
            sampleReservation.flightClass(),
            ReservationStatus.COMPLETED,
            sampleReservation.createdAt(),
            sampleReservation.updatedAt()
        );

        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.of(completedReservation));

        // When & Then
        assertThatThrownBy(() -> flightReservationService.cancelReservation(reservationId))
                .isInstanceOf(FlightReservationException.class)
                .hasMessageContaining("Cannot cancel completed reservation");
    }

    @ParameterizedTest
    @EnumSource(ReservationStatus.class)
    void testUpdateReservationStatus_WithValidStatus_ShouldUpdateSuccessfully(ReservationStatus newStatus) {
        // Given
        String reservationId = "FR-12345678";
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

        when(flightReservationRepository.existsById(reservationId)).thenReturn(true);
        when(flightReservationRepository.updateStatus(reservationId, newStatus)).thenReturn(true);
        when(flightReservationRepository.findById(reservationId)).thenReturn(Optional.of(updatedReservation));

        // When
        FlightReservation result = flightReservationService.updateReservationStatus(reservationId, newStatus);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.status()).isEqualTo(newStatus);
        verify(flightReservationRepository, times(1)).updateStatus(reservationId, newStatus);
    }

    @Test
    void testGetReservationsByEmail_WhenFound_ShouldReturnList() {
        // Given
        String email = "john.doe@email.com";
        List<FlightReservation> expectedReservations = Arrays.asList(sampleReservation);
        when(flightReservationRepository.findByPassengerEmail(email)).thenReturn(expectedReservations);

        // When
        List<FlightReservation> result = flightReservationService.getReservationsByEmail(email);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0)).isEqualTo(sampleReservation);
        verify(flightReservationRepository, times(1)).findByPassengerEmail(email);
    }

    @Test
    void testGetReservationsByEmail_WithNullEmail_ShouldThrowException() {
        // When & Then
        assertThatThrownBy(() -> flightReservationService.getReservationsByEmail(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("Email cannot be null");
    }

    @Test
    void testValidateReservation_WithValidData_ShouldNotThrow() {
        // Given - sampleReservation is valid
        when(flightReservationRepository.save(any(FlightReservation.class))).thenReturn(sampleReservation);

        // When & Then - should not throw any exception
        assertThatCode(() -> flightReservationService.createReservation(sampleReservation))
                .doesNotThrowAnyException();
    }

    @Test
    void testValidateReservation_WithInvalidEmail_ShouldThrowException() {
        // Given
        FlightReservation invalidReservation = new FlightReservation(
            null, "AA101", "John", "Doe", "invalid-email",
            "JFK", "LAX", "12A", FlightClass.ECONOMY, ReservationStatus.CONFIRMED, null, null
        );

        // When & Then
        assertThatThrownBy(() -> flightReservationService.createReservation(invalidReservation))
                .isInstanceOf(FlightReservationException.class)
                .hasMessageContaining("Invalid email format");
    }

    @Test
    void testService_IsProperlyAnnotated() {
        // This test verifies that the service class has proper Spring annotations
        assertThat(FlightReservationService.class.getAnnotation(org.springframework.stereotype.Service.class))
                .isNotNull();
    }
}
