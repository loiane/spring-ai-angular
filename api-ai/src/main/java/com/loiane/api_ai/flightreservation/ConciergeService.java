package com.loiane.api_ai.flightreservation;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Flux;

/**
 * AI concierge service for the SpringFly reservations page.
 * Uses tool calling to look up and manage reservations on behalf of the passenger.
 */
@Service
public class ConciergeService {

    private static final String CONVERSATION_ID = "springfly-concierge";

    private static final String SYSTEM_PROMPT = """
            You are the SpringFly Concierge, a friendly and efficient assistant for the
            SpringFly airline reservations page. You help passengers with their flight
            reservations: looking up bookings, answering questions about them, and
            cancelling reservations when asked.

            Guidelines:
            - Use the available tools to read or change reservation data. Never invent
              reservation details.
            - Before cancelling a reservation, always confirm with the passenger by
              repeating the reservation id and flight details, and only cancel after
              they explicitly confirm.
            - If a reservation cannot be found, say so politely and suggest checking
              the reservation id or email.
            - Keep answers short and conversational. Format lists of reservations in
              a compact, readable way.
            - Only discuss topics related to SpringFly reservations and travel.
            """;

    private final ChatClient chatClient;

    public ConciergeService(ChatClient.Builder chatClientBuilder, FlightReservationTools flightReservationTools) {

        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .maxMessages(20)
                .build();

        this.chatClient = chatClientBuilder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultTools(flightReservationTools)
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();
    }

    public String chat(String message) {
        return this.chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, CONVERSATION_ID))
                .call()
                .content();
    }

    public Flux<String> chatStream(String message) {
        return this.chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, CONVERSATION_ID))
                .stream()
                .content();
    }
}
