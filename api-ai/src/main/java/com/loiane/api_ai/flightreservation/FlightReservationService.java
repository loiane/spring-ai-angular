package com.loiane.api_ai.flightreservation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Service class for managing flight reservations.
 * Contains business logic and follows Spring Boot best practices.
 */
@Service
public class FlightReservationService {

    private static final Logger logger = LoggerFactory.getLogger(FlightReservationService.class);
    
    // Constants for repeated string literals (SonarQube Rule S1192)
    private static final String RESERVATION_ID_NULL_MESSAGE = "Reservation ID cannot be null";
    private static final String FLIGHT_RESERVATION_NOT_FOUND_PREFIX = "Flight reservation not found: ";
    private static final String FAILED_TO_RETRIEVE_PREFIX = "Failed to retrieve flight reservation: ";
    private static final String FAILED_TO_UPDATE_STATUS = "Failed to update reservation status";
    private static final String FAILED_TO_RETRIEVE_UPDATED = "Failed to retrieve updated reservation";
    private static final String FAILED_TO_RETRIEVE_CANCELLED = "Failed to retrieve cancelled reservation";

    private final FlightReservationRepository flightReservationRepository;

    public FlightReservationService(FlightReservationRepository flightReservationRepository) {
        this.flightReservationRepository = Objects.requireNonNull(flightReservationRepository, 
            "FlightReservationRepository cannot be null");
    }

    /**
     * Retrieve all flight reservations
     */
    public List<FlightReservation> getAllReservations() {
        logger.info("Retrieving all flight reservations");
        try {
            List<FlightReservation> reservations = flightReservationRepository.findAll();
            logger.info("Retrieved {} flight reservations", reservations.size());
            return reservations;
        } catch (FlightReservationException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error retrieving flight reservations", e);
            throw new FlightReservationException("Failed to retrieve flight reservations", e);
        }
    }

    /**
     * Get a specific flight reservation by ID
     */
    public Optional<FlightReservation> getReservationById(String reservationId) {
        Objects.requireNonNull(reservationId, RESERVATION_ID_NULL_MESSAGE);
        
        logger.info("Retrieving flight reservation with ID: {}", reservationId);
        try {
            Optional<FlightReservation> reservation = flightReservationRepository.findById(reservationId);
            if (reservation.isPresent()) {
                logger.info("Found flight reservation: {}", reservationId);
            } else {
                logger.warn("Flight reservation not found: {}", reservationId);
            }
            return reservation;
        } catch (FlightReservationException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error retrieving flight reservation: {}", reservationId, e);
            throw new FlightReservationException(FAILED_TO_RETRIEVE_PREFIX + reservationId, e);
        }
    }

    /**
     * Create a new flight reservation
     */
    public FlightReservation createReservation(FlightReservation reservation) {
        Objects.requireNonNull(reservation, "Flight reservation cannot be null");
        validateReservation(reservation);
        
        logger.info("Creating new flight reservation for passenger: {} {}", 
            reservation.passengerFirstName(), reservation.passengerLastName());
        
        try {
            FlightReservation savedReservation = flightReservationRepository.save(reservation);
            logger.info("Successfully created flight reservation: {}", savedReservation.reservationId());
            return savedReservation;
        } catch (FlightReservationException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error creating flight reservation", e);
            throw new FlightReservationException("Failed to create flight reservation", e);
        }
    }

    /**
     * Cancel a flight reservation
     */
    public FlightReservation cancelReservation(String reservationId) {
        Objects.requireNonNull(reservationId, RESERVATION_ID_NULL_MESSAGE);
        
        logger.info("Canceling flight reservation: {}", reservationId);
        
        // First check if the reservation exists
        Optional<FlightReservation> existingReservation = getReservationById(reservationId);
        if (existingReservation.isEmpty()) {
            logger.warn("Cannot cancel - reservation not found: {}", reservationId);
            throw new FlightReservationNotFoundException(FLIGHT_RESERVATION_NOT_FOUND_PREFIX + reservationId);
        }

        FlightReservation reservation = existingReservation.get();
        
        // Check if reservation is already cancelled
        if (reservation.status() == ReservationStatus.CANCELLED) {
            logger.warn("Reservation is already cancelled: {}", reservationId);
            throw new FlightReservationException("Reservation is already cancelled: " + reservationId);
        }

        // Check if reservation is completed (cannot cancel completed flights)
        if (reservation.status() == ReservationStatus.COMPLETED) {
            logger.warn("Cannot cancel completed reservation: {}", reservationId);
            throw new FlightReservationException("Cannot cancel completed reservation: " + reservationId);
        }

        try {
            boolean updated = flightReservationRepository.updateStatus(reservationId, ReservationStatus.CANCELLED);
            if (!updated) {
                throw new FlightReservationException(FAILED_TO_UPDATE_STATUS);
            }
            
            // Return the updated reservation
            Optional<FlightReservation> cancelledReservation = getReservationById(reservationId);
            logger.info("Successfully cancelled flight reservation: {}", reservationId);
            return cancelledReservation.orElseThrow(() -> 
                new FlightReservationException(FAILED_TO_RETRIEVE_CANCELLED));
                
        } catch (FlightReservationException | FlightReservationNotFoundException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error canceling flight reservation: {}", reservationId, e);
            throw new FlightReservationException("Failed to cancel flight reservation: " + reservationId, e);
        }
    }

    /**
     * Update reservation status
     */
    public FlightReservation updateReservationStatus(String reservationId, ReservationStatus newStatus) {
        Objects.requireNonNull(reservationId, RESERVATION_ID_NULL_MESSAGE);
        Objects.requireNonNull(newStatus, "New status cannot be null");
        
        logger.info("Updating reservation {} status to {}", reservationId, newStatus);
        
        // Verify reservation exists
        if (!flightReservationRepository.existsById(reservationId)) {
            throw new FlightReservationNotFoundException(FLIGHT_RESERVATION_NOT_FOUND_PREFIX + reservationId);
        }

        try {
            boolean updated = flightReservationRepository.updateStatus(reservationId, newStatus);
            if (!updated) {
                throw new FlightReservationException(FAILED_TO_UPDATE_STATUS);
            }
            
            Optional<FlightReservation> updatedReservation = getReservationById(reservationId);
            logger.info("Successfully updated reservation {} status to {}", reservationId, newStatus);
            return updatedReservation.orElseThrow(() -> 
                new FlightReservationException(FAILED_TO_RETRIEVE_UPDATED));
                
        } catch (FlightReservationException | FlightReservationNotFoundException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error updating reservation status: {}", reservationId, e);
            throw new FlightReservationException("Failed to update reservation status: " + reservationId, e);
        }
    }

    /**
     * Get reservations by passenger email
     */
    public List<FlightReservation> getReservationsByEmail(String email) {
        Objects.requireNonNull(email, "Email cannot be null");
        
        logger.info("Retrieving reservations for email: {}", email);
        try {
            List<FlightReservation> reservations = flightReservationRepository.findByPassengerEmail(email);
            logger.info("Found {} reservations for email: {}", reservations.size(), email);
            return reservations;
        } catch (FlightReservationException e) {
            // Re-throw business exceptions as-is
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error retrieving reservations for email: {}", email, e);
            throw new FlightReservationException("Failed to retrieve reservations for email: " + email, e);
        }
    }

    /**
     * Validate flight reservation data
     */
    private void validateReservation(FlightReservation reservation) {
        if (reservation.flightNumber() == null || reservation.flightNumber().trim().isEmpty()) {
            throw new FlightReservationException("Flight number cannot be empty");
        }
        
        if (reservation.passengerFirstName() == null || reservation.passengerFirstName().trim().isEmpty()) {
            throw new FlightReservationException("Passenger first name cannot be empty");
        }
        
        if (reservation.passengerLastName() == null || reservation.passengerLastName().trim().isEmpty()) {
            throw new FlightReservationException("Passenger last name cannot be empty");
        }
        
        if (reservation.passengerEmail() == null || reservation.passengerEmail().trim().isEmpty()) {
            throw new FlightReservationException("Passenger email cannot be empty");
        }
        
        if (reservation.departureAirport() == null || reservation.departureAirport().trim().isEmpty()) {
            throw new FlightReservationException("Departure airport cannot be empty");
        }
        
        if (reservation.arrivalAirport() == null || reservation.arrivalAirport().trim().isEmpty()) {
            throw new FlightReservationException("Arrival airport cannot be empty");
        }
        
        if (reservation.flightClass() == null) {
            throw new FlightReservationException("Flight class cannot be null");
        }
        
        // Basic email validation
        if (!reservation.passengerEmail().contains("@")) {
            throw new FlightReservationException("Invalid email format");
        }
    }
}
