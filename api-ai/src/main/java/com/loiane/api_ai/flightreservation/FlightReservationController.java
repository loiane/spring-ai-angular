package com.loiane.api_ai.flightreservation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * REST Controller for managing flight reservations.
 * Follows the existing pattern established in other controllers.
 */
@RestController
@RequestMapping("/api/flight-reservations")
public class FlightReservationController {

    private static final Logger logger = LoggerFactory.getLogger(FlightReservationController.class);

    private final FlightReservationService flightReservationService;

    public FlightReservationController(FlightReservationService flightReservationService) {
        this.flightReservationService = flightReservationService;
    }

    /**
     * Get all flight reservations
     */
    @GetMapping
    public ResponseEntity<List<FlightReservation>> getAllReservations() {
        logger.info("GET /api/flight-reservations - retrieving all reservations");
        try {
            List<FlightReservation> reservations = flightReservationService.getAllReservations();
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            logger.error("Error retrieving all reservations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific flight reservation by ID
     */
    @GetMapping("/{reservationId}")
    public ResponseEntity<FlightReservation> getReservation(@PathVariable String reservationId) {
        logger.info("GET /api/flight-reservations/{} - retrieving reservation", reservationId);
        try {
            Optional<FlightReservation> reservation = flightReservationService.getReservationById(reservationId);
            
            if (reservation.isPresent()) {
                return ResponseEntity.ok(reservation.get());
            } else {
                logger.warn("Reservation not found: {}", reservationId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error retrieving reservation: {}", reservationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Create a new flight reservation
     */
    @PostMapping
    public ResponseEntity<FlightReservation> createReservation(@RequestBody CreateReservationRequest request) {
        logger.info("POST /api/flight-reservations - creating new reservation");
        try {
            // Convert request to FlightReservation
            FlightReservation reservation = new FlightReservation(
                null, // ID will be generated
                request.flightNumber(),
                request.passengerFirstName(),
                request.passengerLastName(),
                request.passengerEmail(),
                request.departureAirport(),
                request.arrivalAirport(),
                request.seatNumber(),
                request.flightClass(),
                ReservationStatus.CONFIRMED,
                null, // Will be set by repository
                null  // Will be set by repository
            );
            
            FlightReservation createdReservation = flightReservationService.createReservation(reservation);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReservation);
            
        } catch (FlightReservationException e) {
            logger.warn("Validation error creating reservation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating reservation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancel a flight reservation
     */
    @PutMapping("/{reservationId}/cancel")
    public ResponseEntity<FlightReservation> cancelReservation(@PathVariable String reservationId) {
        logger.info("PUT /api/flight-reservations/{}/cancel - canceling reservation", reservationId);
        try {
            FlightReservation cancelledReservation = flightReservationService.cancelReservation(reservationId);
            return ResponseEntity.ok(cancelledReservation);
            
        } catch (FlightReservationNotFoundException _) {
            logger.warn("Reservation not found for cancellation: {}", reservationId);
            return ResponseEntity.notFound().build();
        } catch (FlightReservationException e) {
            logger.warn("Cannot cancel reservation {}: {}", reservationId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error canceling reservation: {}", reservationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update reservation status
     */
    @PutMapping("/{reservationId}/status")
    public ResponseEntity<FlightReservation> updateReservationStatus(
            @PathVariable String reservationId, 
            @RequestBody UpdateStatusRequest request) {
        logger.info("PUT /api/flight-reservations/{}/status - updating status to {}", 
            reservationId, request.status());
        try {
            FlightReservation updatedReservation = flightReservationService
                .updateReservationStatus(reservationId, request.status());
            return ResponseEntity.ok(updatedReservation);
            
        } catch (FlightReservationNotFoundException _) {
            logger.warn("Reservation not found for status update: {}", reservationId);
            return ResponseEntity.notFound().build();
        } catch (FlightReservationException e) {
            logger.warn("Cannot update reservation {} status: {}", reservationId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating reservation status: {}", reservationId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get reservations by passenger email
     */
    @GetMapping("/search")
    public ResponseEntity<List<FlightReservation>> getReservationsByEmail(@RequestParam String email) {
        logger.info("GET /api/flight-reservations/search?email={} - searching reservations", email);
        try {
            List<FlightReservation> reservations = flightReservationService.getReservationsByEmail(email);
            return ResponseEntity.ok(reservations);
        } catch (Exception e) {
            logger.error("Error searching reservations for email: {}", email, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
