package com.loiane.mcp_client_ai;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatController {

    private final FlightConciergeClientService flightConciergeClientService;

    public ChatController(FlightConciergeClientService flightConciergeClientService) {
        this.flightConciergeClientService = flightConciergeClientService;
    }

    @PostMapping("/api/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        return new ChatResponse(flightConciergeClientService.chat(request.message()));
    }

    public record ChatRequest(String message) {
    }

    public record ChatResponse(String reply) {
    }
}
