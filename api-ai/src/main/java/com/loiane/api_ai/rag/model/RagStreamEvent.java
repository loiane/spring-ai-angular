package com.loiane.api_ai.rag.model;

import java.util.List;

/**
 * Represents a single event emitted while streaming a RAG answer.
 *
 * <p>Two event types are emitted:
 * <ul>
 *   <li>{@code answer} - an incremental chunk of the generated answer text</li>
 *   <li>{@code sources} - the final event, carrying the source citations used
 *       to generate the answer</li>
 * </ul>
 *
 * @param type    the event type, either "answer" or "sources"
 * @param content the answer text chunk (only set for "answer" events)
 * @param sources the source citations (only set for "sources" events)
 */
public record RagStreamEvent(String type, String content, List<Source> sources) {

    public static RagStreamEvent answer(String content) {
        return new RagStreamEvent("answer", content, null);
    }

    public static RagStreamEvent sources(List<Source> sources) {
        return new RagStreamEvent("sources", null, sources);
    }
}
