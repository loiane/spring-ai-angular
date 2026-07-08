package com.loiane.api_ai.flightreservation;

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
 * REST Controller for the SpringFly AI concierge chat.
 */
@RestController
@RequestMapping("/api/concierge")
public class ConciergeController {

    private static final Logger logger = LoggerFactory.getLogger(ConciergeController.class);

    private final ConciergeService conciergeService;

    public ConciergeController(ConciergeService conciergeService) {
        this.conciergeService = conciergeService;
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ConciergeResponse> chatStream(@RequestBody ConciergeRequest request) {
        logger.info("POST /api/concierge/stream - processing concierge message");
        return conciergeService.chatStream(request.message())
                .map(ConciergeResponse::new);
    }

    @PostMapping
    public ResponseEntity<ConciergeResponse> chat(@RequestBody ConciergeRequest request) {
        logger.info("POST /api/concierge - processing concierge message");
        try {
            String content = conciergeService.chat(request.message());
            return ResponseEntity.ok(new ConciergeResponse(content));
        } catch (Exception e) {
            logger.error("Error processing concierge message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
