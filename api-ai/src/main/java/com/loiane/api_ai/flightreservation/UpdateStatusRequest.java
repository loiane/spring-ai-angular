package com.loiane.api_ai.flightreservation;

/**
 * Request record for updating reservation status.
 * Following Java Records best practice for DTOs.
 */
public record UpdateStatusRequest(
        ReservationStatus status
) {}
