package com.loiane.api_ai.booksprompt;

/**
 * Exception thrown when a book cover image cannot be processed.
 */
public class BookCoverException extends RuntimeException {

    public BookCoverException(String message) {
        super(message);
    }

    public BookCoverException(String message, Throwable cause) {
        super(message, cause);
    }
}
