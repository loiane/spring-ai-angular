package com.loiane.api_ai.rag.model;

/**
 * Represents the processing status of an uploaded document.
 * 
 * <p>Status transitions:
 * <ul>
 *   <li>PROCESSING - Document is being processed (uploaded, text extracted, vectorized)</li>
 *   <li>READY - Document has been successfully processed and is ready for RAG queries</li>
 *   <li>ERROR - An error occurred during processing</li>
 * </ul>
 * 
 * @author Loiane Groner
 * @since 1.0
 */
public enum DocumentStatus {
    /**
     * Document is currently being processed.
     * The document has been uploaded and is being parsed, chunked, and vectorized.
     */
    PROCESSING,
    
    /**
     * Document processing completed successfully.
     * The document is ready to be queried via RAG.
     */
    READY,
    
    /**
     * An error occurred during document processing.
     * Check the document's error_message field for details.
     */
    ERROR
}
