package com.loiane.api_ai.flightreservation;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for ConciergeController
 */
@ExtendWith(MockitoExtension.class)
class ConciergeControllerTest {

    @Mock
    private ConciergeService conciergeService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        ConciergeController conciergeController = new ConciergeController(conciergeService);
        mockMvc = MockMvcBuilders.standaloneSetup(conciergeController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void shouldReturnConciergeResponse() throws Exception {
        ConciergeRequest request = new ConciergeRequest("Show me my reservations");
        when(conciergeService.chat(request.message()))
                .thenReturn("You have 1 reservation: FR-D8287E9D.");

        mockMvc.perform(post("/api/concierge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("You have 1 reservation: FR-D8287E9D."));
    }

    @Test
    void shouldReturnInternalServerErrorWhenServiceFails() throws Exception {
        ConciergeRequest request = new ConciergeRequest("Show me my reservations");
        when(conciergeService.chat(anyString())).thenThrow(new RuntimeException("AI unavailable"));

        mockMvc.perform(post("/api/concierge")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }
}
