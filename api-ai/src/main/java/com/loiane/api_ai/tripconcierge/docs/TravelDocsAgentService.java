package com.loiane.api_ai.tripconcierge.docs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.loiane.api_ai.rag.RagService;
import com.loiane.api_ai.rag.model.RagResponse;

/**
 * Travel-docs agent for the Trip Concierge. Thin wrapper around the existing RAG
 * pipeline: answers visa/entry-requirement questions grounded in whatever travel
 * documents have been uploaded via the /api/rag/upload endpoint. If no relevant
 * document has been uploaded, RagService's refusal message is returned as-is.
 */
@Service
public class TravelDocsAgentService {

    private static final Logger logger = LoggerFactory.getLogger(TravelDocsAgentService.class);

    private final RagService ragService;

    public TravelDocsAgentService(RagService ragService) {
        this.ragService = ragService;
    }

    public String getEntryRequirements(String destination) {
        logger.info("Looking up travel docs for destination: {}", destination);

        String question = "What visa, passport, or entry requirements apply for travelers visiting "
                + destination + "?";
        RagResponse response = ragService.askQuestion(question, null);
        return response.answer();
    }
}
