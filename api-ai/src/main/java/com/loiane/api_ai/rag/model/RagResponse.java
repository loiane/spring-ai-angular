package com.loiane.api_ai.rag.model;

import java.util.List;

/**
 * Represents the response from a RAG (Retrieval-Augmented Generation) query.
 * 
 * <p>This record combines the AI-generated answer with the source citations
 * from the documents that were used to generate the answer. This provides
 * transparency and allows users to verify the information.
 * 
 * @param answer The AI-generated answer to the user's question
 * @param sources List of document sources that were used to generate the answer
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public record RagResponse(
    String answer,
    List<Source> sources
) {
    /**
     * Creates a new RagResponse with the specified answer and sources.
     * 
     * @param answer The generated answer
     * @param sources List of source citations
     */
    public RagResponse {
        // Ensure sources is not null
        if (sources == null) {
            sources = List.of();
        }
    }
    
    /**
     * Creates a new RagResponse with only an answer and no sources.
     * Convenience constructor for responses without citations.
     * 
     * @param answer The generated answer
     */
    public RagResponse(String answer) {
        this(answer, List.of());
    }
    
    /**
     * Returns the number of sources cited in this response.
     * 
     * @return Number of sources
     */
    public int getSourceCount() {
        return sources.size();
    }
    
    /**
     * Checks if this response has any source citations.
     * 
     * @return true if sources are present, false otherwise
     */
    public boolean hasSources() {
        return !sources.isEmpty();
    }
}
