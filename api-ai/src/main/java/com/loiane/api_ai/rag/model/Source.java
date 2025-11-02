package com.loiane.api_ai.rag.model;

import java.util.Map;

/**
 * Represents a source citation from a document that was used to generate a RAG response.
 * 
 * <p>Each source contains a relevant text excerpt from a document,
 * along with metadata about where it came from. This allows users to
 * verify the AI's answers and explore the original documents.
 * 
 * @param content The text content of the retrieved document chunk
 * @param filename Name of the source document file
 * @param metadata Additional metadata about the source (e.g., page number, document ID, chunk index)
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public record Source(
    String content,
    String filename,
    Map<String, Object> metadata
) {
    /**
     * Creates a new Source with the specified content and metadata.
     * 
     * @param content Text excerpt from the document
     * @param filename Original document filename
     * @param metadata Additional source metadata
     */
    public Source {
        // Ensure metadata is not null
        if (metadata == null) {
            metadata = Map.of();
        }
    }
    
    /**
     * Creates a new Source without metadata.
     * Convenience constructor for simple sources.
     * 
     * @param content Text excerpt from the document
     * @param filename Original document filename
     */
    public Source(String content, String filename) {
        this(content, filename, Map.of());
    }
}
