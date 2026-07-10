package com.loiane.mcp_client_ai;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.stereotype.Service;

/**
 * Same SpringFly concierge behaviour as api-ai's ConciergeService, but the
 * flight reservation tools are resolved remotely over MCP instead of from a
 * local bean. Spring AI's MCP client autoconfiguration supplies the
 * {@link ToolCallbackProvider} bean, built from the tools discovered on the
 * MCP server(s) configured in application.properties.
 */
@Service
public class FlightConciergeClientService {

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
            - Keep answers short and conversational.
            """;

    private final ChatClient chatClient;

    public FlightConciergeClientService(ChatClient.Builder chatClientBuilder, ToolCallbackProvider toolCallbackProvider) {
        this.chatClient = chatClientBuilder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultToolCallbacks(toolCallbackProvider)
                .build();
    }

    public String chat(String message) {
        return this.chatClient.prompt()
                .user(message)
                .call()
                .content();
    }
}
