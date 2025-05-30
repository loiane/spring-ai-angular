package com.loiane.api_ai.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for ChatController
 */
@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private SimpleChatService simpleChatService;

    private ChatController chatController;
    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        chatController = new ChatController(simpleChatService);
        mockMvc = MockMvcBuilders.standaloneSetup(chatController).build();
        objectMapper = new ObjectMapper();
    }

    @ParameterizedTest
    @CsvSource({
        "'Hello, how are you?', 'I''m doing great, thank you for asking!'",
        "'', 'I didn''t receive any message.'",
        "'What is Spring Boot?', 'Spring Boot is a framework that makes it easy to create stand-alone, production-grade Spring based Applications.'"
    })
    void testChatWithDifferentMessages(String userMessage, String expectedResponse) throws Exception {
        // Given
        ChatRequest request = new ChatRequest(userMessage);
        
        when(simpleChatService.chat(userMessage)).thenReturn(expectedResponse);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value(expectedResponse));

        verify(simpleChatService, times(1)).chat(userMessage);
    }

    @Test
    void testChatWithNullMessage() throws Exception {
        // Given
        ChatRequest request = new ChatRequest(null);
        String aiResponse = "No message provided.";
        
        when(simpleChatService.chat(null)).thenReturn(aiResponse);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value(aiResponse));

        verify(simpleChatService, times(1)).chat(null);
    }

    @Test
    void testChatWithLongMessage() throws Exception {
        // Given
        String userMessage = "This is a very long message that contains multiple sentences and covers various topics. " +
                "It's designed to test how the chat controller handles longer input messages and ensures that " +
                "the system can process them correctly without any issues.";
        String aiResponse = "Thank you for your detailed message. I understand you're testing the system with longer input.";
        ChatRequest request = new ChatRequest(userMessage);
        
        when(simpleChatService.chat(userMessage)).thenReturn(aiResponse);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value(aiResponse));

        verify(simpleChatService, times(1)).chat(userMessage);
    }

    @Test
    void testChatWithSpecialCharacters() throws Exception {
        // Given
        String userMessage = "Hello! How are you? 😊 Can you help with coding? @#$%^&*()";
        String aiResponse = "I can definitely help with coding and special characters!";
        ChatRequest request = new ChatRequest(userMessage);
        
        when(simpleChatService.chat(userMessage)).thenReturn(aiResponse);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value(aiResponse));

        verify(simpleChatService, times(1)).chat(userMessage);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{ invalid json }", "{ \"message\": }"})
    void testChatWithInvalidJsonRequest(String invalidJson) throws Exception {
        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson))
                .andDo(print())
                .andExpect(status().isBadRequest());

        verify(simpleChatService, never()).chat(anyString());
    }

    @Test
    void testChatWithMissingContentType() throws Exception {
        // Given
        String userMessage = "Hello";
        ChatRequest request = new ChatRequest(userMessage);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isUnsupportedMediaType());

        verify(simpleChatService, never()).chat(anyString());
    }

    @Test
    void testChatWithWrongHttpMethod() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/chat"))
                .andDo(print())
                .andExpect(status().isMethodNotAllowed());

        verify(simpleChatService, never()).chat(anyString());
    }

    @Test
    void testChatResponseStructure() throws Exception {
        // Given
        String userMessage = "Structure test";
        String aiResponse = "Response for structure test";
        ChatRequest request = new ChatRequest(userMessage);
        
        when(simpleChatService.chat(userMessage)).thenReturn(aiResponse);

        // When & Then
        mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.message").value(aiResponse));

        verify(simpleChatService, times(1)).chat(userMessage);
    }
}
