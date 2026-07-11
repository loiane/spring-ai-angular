package com.loiane.api_ai.tripconcierge;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Flux;

/**
 * REST Controller for the Trip Planning Concierge.
 */
@RestController
@RequestMapping("/api/trip")
public class TripConciergeController {

    private static final Logger logger = LoggerFactory.getLogger(TripConciergeController.class);

    private final TripConciergeService tripConciergeService;

    public TripConciergeController(TripConciergeService tripConciergeService) {
        this.tripConciergeService = tripConciergeService;
    }

    @PostMapping("/plan")
    public ResponseEntity<TripPlanResult> plan(@RequestBody TripConciergeRequest request) {
        logger.info("POST /api/trip/plan - planning trip");
        try {
            TripPlanResult result = tripConciergeService.planTrip(request.message());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error planning trip", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/plan/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<TripPlanStreamEvent> planStream(@RequestBody TripConciergeRequest request) {
        logger.info("POST /api/trip/plan/stream - planning trip");
        return tripConciergeService.planTripStream(request.message());
    }
}
