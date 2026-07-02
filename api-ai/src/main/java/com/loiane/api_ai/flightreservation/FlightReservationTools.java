package com.loiane.api_ai.flightreservation;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

/**
 * Tools exposed to the AI concierge for managing flight reservations.
 */
@Component
public class FlightReservationTools {

    private static final Logger logger = LoggerFactory.getLogger(FlightReservationTools.class);

    private final FlightReservationService flightReservationService;

    public FlightReservationTools(FlightReservationService flightReservationService) {
        this.flightReservationService = flightReservationService;
    }

    @Tool(description = "Get the list of all flight reservations with passenger, flight, seat and status details")
    public List<FlightReservation> getAllReservations() {
        logger.info("Tool call: getAllReservations");
        return flightReservationService.getAllReservations();
    }

    @Tool(description = "Get a flight reservation by its reservation id (e.g. FR-XXXXXXXX)")
    public FlightReservation getReservation(
            @ToolParam(description = "The reservation id") String reservationId) {
        logger.info("Tool call: getReservation {}", reservationId);
        return flightReservationService.getReservationById(reservationId)
                .orElseThrow(() -> new FlightReservationNotFoundException(reservationId));
    }

    @Tool(description = "Search flight reservations by passenger email")
    public List<FlightReservation> searchReservationsByEmail(
            @ToolParam(description = "The passenger email") String email) {
        logger.info("Tool call: searchReservationsByEmail {}", email);
        return flightReservationService.getReservationsByEmail(email);
    }

    @Tool(description = "Cancel a flight reservation by its reservation id. Only call this after the passenger explicitly confirms the cancellation.")
    public FlightReservation cancelReservation(
            @ToolParam(description = "The reservation id") String reservationId) {
        logger.info("Tool call: cancelReservation {}", reservationId);
        return flightReservationService.cancelReservation(reservationId);
    }
}
