package com.loiane.api_ai.rag;

/**
 * Exception thrown when document processing fails.
 * 
 * <p>This can occur during any phase of document processing including:
 * <ul>
 *   <li>PDF text extraction</li>
 *   <li>Text chunking</li>
 *   <li>Embedding generation</li>
 *   <li>Vector storage</li>
 * </ul>
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public class DocumentProcessingException extends RuntimeException {
    
    /**
     * Creates a new DocumentProcessingException with the specified message.
     * 
     * @param message The exception message
     */
    public DocumentProcessingException(String message) {
        super(message);
    }
    
    /**
     * Creates a new DocumentProcessingException with the specified message and cause.
     * 
     * @param message The exception message
     * @param cause The underlying cause
     */
    public DocumentProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
