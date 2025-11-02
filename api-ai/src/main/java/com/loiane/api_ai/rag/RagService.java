package com.loiane.api_ai.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.loiane.api_ai.rag.model.RagResponse;
import com.loiane.api_ai.rag.model.Source;

import com.loiane.api_ai.rag.model.RagResponse;
import com.loiane.api_ai.rag.model.Source;

/**
 * RAG (Retrieval-Augmented Generation) service for answering questions using uploaded documents.
 * 
 * <p>This service implements the RAG pipeline:
 * <ol>
 *   <li>Query vector store for relevant document chunks</li>
 *   <li>Use ChatClient with QuestionAnswerAdvisor to generate answer</li>
 *   <li>Extract sources from document metadata for citations</li>
 * </ol>
 * 
 * @author Loiane Groner
 * @since 1.0
 */
@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public RagService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore) {
        this.vectorStore = vectorStore;
        
        // Configure ChatClient with QuestionAnswerAdvisor as a default advisor
        this.chatClient = chatClientBuilder
                .defaultAdvisors(
                        QuestionAnswerAdvisor.builder(vectorStore)
                                .build()
                )
                .build();
    }

    /**
     * Ask a question using the RAG pipeline.
     * 
     * <p>This method:
     * <ol>
     *   <li>Uses QuestionAnswerAdvisor to retrieve relevant chunks from vector store</li>
     *   <li>Generates an answer using ChatClient with the retrieved context</li>
     *   <li>Extracts source information from the document metadata</li>
     * </ol>
     * 
     * @param question The question to ask
     * @return A RagResponse with the answer and source citations
     */
    public RagResponse askQuestion(String question) {
        log.info("Processing RAG question: {}", question);

        try {
            // QuestionAnswerAdvisor automatically retrieves relevant documents
            // and injects them as context for the LLM
            String answer = chatClient.prompt()
                    .user(question)
                    .call()
                    .content();

            // Retrieve documents separately for source attribution
            List<Document> relevantDocs = vectorStore.similaritySearch(question);

            // Extract unique sources from document metadata
            List<Source> sources = extractSources(relevantDocs);

            log.info("Generated answer with {} sources", sources.size());
            return new RagResponse(answer, sources);

        } catch (Exception e) {
            log.error("Error processing RAG question: {}", question, e);
            return new RagResponse(
                    "Sorry, I encountered an error while processing your question. Please try again.",
                    List.of()
            );
        }
    }

    /**
     * Extracts unique source information from document metadata.
     * 
     * @param documents The retrieved documents
     * @return List of unique sources with filename and snippet
     */
    private List<Source> extractSources(List<Document> documents) {
        List<Source> sources = new ArrayList<>();
        
        for (Document doc : documents) {
            Map<String, Object> metadata = doc.getMetadata();
            
            // Extract metadata (set by DocumentService)
            String documentId = (String) metadata.getOrDefault("document_id", "unknown");
            String filename = (String) metadata.getOrDefault("filename", "unknown");
            
            // Extract a snippet of the content (first 200 chars)
            String content = doc.getText();
            String snippet = content.length() > 200 
                    ? content.substring(0, 200) + "..." 
                    : content;
            
            // Create metadata map for the source
            Map<String, Object> sourceMetadata = new HashMap<>();
            sourceMetadata.put("document_id", documentId);
            sourceMetadata.put("snippet", snippet);
            
            // Add only if not already present (basic deduplication by documentId)
            if (sources.stream().noneMatch(s -> s.metadata().get("document_id").equals(documentId))) {
                sources.add(new Source(snippet, filename, sourceMetadata));
            }
        }
        
        return sources;
    }
}
