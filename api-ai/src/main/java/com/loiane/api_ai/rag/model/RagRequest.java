package com.loiane.api_ai.rag.model;

/**
 * Request payload for RAG questions.
 *
 * @param question   the question to ask
 * @param documentId optional document id to scope retrieval to a single document
 */
public record RagRequest(String question, String documentId) {
}
