package com.loiane.api_ai.rag;

/**
 * Exception thrown when a requested document is not found in the system.
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public class DocumentNotFoundException extends RuntimeException {
    
    /**
     * Creates a new DocumentNotFoundException with the specified message.
     * 
     * @param message The exception message
     */
    public DocumentNotFoundException(String message) {
        super(message);
    }
    
    /**
     * Creates a new DocumentNotFoundException with the specified message and cause.
     * 
     * @param message The exception message
     * @param cause The underlying cause
     */
    public DocumentNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
