package com.loiane.api_ai.rag;

import org.springframework.stereotype.Service;

/**
 * RAG (Retrieval-Augmented Generation) service stub.
 *
 * This is a minimal implementation so the controller can compile. The real
 * implementation will use VectorStore, ChatClient, and advisors to answer queries.
 */
@Service
public class RagService {

    /**
     * Ask a question using the RAG pipeline. Currently not implemented.
     *
     * @param question The question to ask
     * @return A RagResponse with a placeholder answer
     */
    public RagResponse askQuestion(String question) {
        return new RagResponse("Not implemented: askQuestion", java.util.List.of());
    }
}
