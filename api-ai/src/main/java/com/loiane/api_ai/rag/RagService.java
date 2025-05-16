package com.loiane.api_ai.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

/**
 * Service for handling Retrieval-Augmented Generation (RAG) operations.
 * This service separates the business logic from the controller.
 */
@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public RagService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore) {
        this.vectorStore = vectorStore;
        log.debug("Building chat client for RAG service");
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * Process a chat message using RAG to enhance the response with relevant information
     * from the vector store.
     *
     * @param message The user's message
     * @return The AI-generated response enhanced with information from the vector store
     * @throws IllegalArgumentException if the message is null or empty
     * @throws RuntimeException if there's an error communicating with the AI service
     */
    public String chat(String message) {
        if (message == null || message.trim().isEmpty()) {
            log.warn("Received null or empty message");
            throw new IllegalArgumentException("Message cannot be null or empty");
        }

        try {
            log.debug("Sending message to AI with RAG: {}", message);
            String response = this.chatClient.prompt()
                    .user(message)
                    .advisors(new QuestionAnswerAdvisor(vectorStore))
                    .call()
                    .content();
            log.debug("Received response from AI with RAG");
            return response;
        } catch (Exception e) {
            log.error("Error while communicating with AI service for RAG", e);
            throw new RuntimeException("Failed to get response from AI service for RAG", e);
        }
    }
}
