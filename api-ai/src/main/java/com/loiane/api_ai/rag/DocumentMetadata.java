package com.loiane.api_ai.rag;

import java.time.LocalDateTime;

/**
 * Represents metadata about an uploaded document in the RAG system.
 * 
 * <p>This record stores information about documents that have been uploaded
 * for retrieval-augmented generation. The actual document content is stored
 * as vectors in the vector store, while this record maintains the metadata.
 * 
 * @param id Unique identifier (UUID) for the document
 * @param filename Original filename of the uploaded document
 * @param contentType MIME type of the document (e.g., "application/pdf")
 * @param fileSize Size of the file in bytes
 * @param uploadDate Timestamp when the document was uploaded
 * @param status Current processing status of the document
 * @param errorMessage Error message if status is ERROR, null otherwise
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public record DocumentMetadata(
    String id,
    String filename,
    String contentType,
    Long fileSize,
    LocalDateTime uploadDate,
    DocumentStatus status,
    String errorMessage
) {
    /**
     * Creates a new DocumentMetadata without an error message.
     * Convenience constructor for successful documents.
     * 
     * @param id Unique identifier
     * @param filename Original filename
     * @param contentType MIME type
     * @param fileSize Size in bytes
     * @param uploadDate Upload timestamp
     * @param status Processing status
     */
    public DocumentMetadata(String id, String filename, String contentType, 
                   Long fileSize, LocalDateTime uploadDate, 
                   DocumentStatus status) {
        this(id, filename, contentType, fileSize, uploadDate, status, null);
    }
}
