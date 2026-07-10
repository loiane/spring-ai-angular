package com.loiane.api_ai.flightreservation.config;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.loiane.api_ai.flightreservation.FlightReservationTools;

/**
 * Exposes the existing flight reservation tools over MCP, in addition to
 * their in-process use by {@link com.loiane.api_ai.flightreservation.ConciergeService}.
 */
@Configuration
public class McpServerConfig {

    @Bean
    public ToolCallbackProvider flightReservationToolCallbackProvider(FlightReservationTools flightReservationTools) {
        return MethodToolCallbackProvider.builder()
                .toolObjects(flightReservationTools)
                .build();
    }
}
