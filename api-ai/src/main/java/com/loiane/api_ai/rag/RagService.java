package com.loiane.api_ai.rag;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import com.loiane.api_ai.rag.config.DocumentProperties;
import com.loiane.api_ai.rag.model.RagResponse;
import com.loiane.api_ai.rag.model.RagStreamEvent;
import com.loiane.api_ai.rag.model.Source;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

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

    static final String REFUSAL_MESSAGE =
            "I'm sorry, I can only answer questions about the uploaded document, and I couldn't find that information in it.";

    private static final PromptTemplate QA_PROMPT = new PromptTemplate("""
            {query}

            You are a document Q&A assistant. Answer the question above using ONLY the context below.
            If the context does not contain the information needed to answer, or the question is not
            about the document, reply exactly with:
            "%s"
            Do not use outside knowledge.

            Context:
            ---------------------
            {question_answer_context}
            ---------------------
            """.formatted(REFUSAL_MESSAGE));

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final DocumentProperties documentProperties;

    public RagService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore,
                      DocumentProperties documentProperties) {
        this.vectorStore = vectorStore;
        this.documentProperties = documentProperties;

        // Configure ChatClient with QuestionAnswerAdvisor as a default advisor,
        // using a grounded prompt that restricts answers to the retrieved context
        this.chatClient = chatClientBuilder
                .defaultAdvisors(
                        QuestionAnswerAdvisor.builder(vectorStore)
                                .promptTemplate(QA_PROMPT)
                                .searchRequest(SearchRequest.builder()
                                        .topK(documentProperties.getTopK())
                                        .build())
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
     * @param documentId Optional document id to scope retrieval to a single document
     * @return A RagResponse with the answer and source citations
     */
    public RagResponse askQuestion(String question, String documentId) {
        log.info("Processing RAG question: {} (documentId: {})", question, documentId);

        try {
            Filter.Expression filter = buildDocumentFilter(documentId);

            // QuestionAnswerAdvisor automatically retrieves relevant documents
            // and injects them as context for the LLM
            String answer = buildPrompt(question, documentId).call().content();

            if (answer != null && answer.contains(REFUSAL_MESSAGE)) {
                return new RagResponse(REFUSAL_MESSAGE, List.of());
            }

            // Retrieve documents separately for source attribution
            SearchRequest searchRequest = SearchRequest.builder()
                    .query(question)
                    .topK(documentProperties.getTopK())
                    .filterExpression(filter)
                    .build();
            List<Document> relevantDocs = vectorStore.similaritySearch(searchRequest);

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
     * Ask a question using the RAG pipeline, streaming the answer as it is generated.
     *
     * <p>Emits a sequence of "answer" events with incremental content chunks,
     * followed by a single terminal "sources" event once the answer is complete.
     *
     * @param question   The question to ask
     * @param documentId Optional document id to scope retrieval to a single document
     * @return A Flux of RagStreamEvent, ending with a "sources" event
     */
    public Flux<RagStreamEvent> askQuestionStream(String question, String documentId) {
        log.info("Processing streaming RAG question: {} (documentId: {})", question, documentId);

        Filter.Expression filter = buildDocumentFilter(documentId);

        StringBuilder answerBuilder = new StringBuilder();

        Flux<RagStreamEvent> answerFlux = buildPrompt(question, documentId).stream().content()
                .doOnNext(answerBuilder::append)
                .map(RagStreamEvent::answer);

        Mono<RagStreamEvent> sourcesMono = Mono.fromCallable(() -> resolveSources(question, filter, answerBuilder.toString()))
                .subscribeOn(Schedulers.boundedElastic());

        return Flux.concat(answerFlux, sourcesMono)
                .onErrorResume(e -> {
                    log.error("Error processing streaming RAG question: {}", question, e);
                    return Flux.just(RagStreamEvent.answer(
                            "Sorry, I encountered an error while processing your question. Please try again."),
                            RagStreamEvent.sources(List.of()));
                });
    }

    private RagStreamEvent resolveSources(String question, Filter.Expression filter, String answer) {
        if (answer != null && answer.contains(REFUSAL_MESSAGE)) {
            return RagStreamEvent.sources(List.of());
        }

        SearchRequest searchRequest = SearchRequest.builder()
                .query(question)
                .topK(documentProperties.getTopK())
                .filterExpression(filter)
                .build();
        List<Document> relevantDocs = vectorStore.similaritySearch(searchRequest);
        List<Source> sources = extractSources(relevantDocs);

        log.info("Streamed answer with {} sources", sources.size());
        return RagStreamEvent.sources(sources);
    }

    /**
     * Builds the prompt spec for a question, scoping the QuestionAnswerAdvisor
     * retrieval to a single document when a documentId is provided.
     */
    private ChatClient.ChatClientRequestSpec buildPrompt(String question, String documentId) {
        var promptSpec = chatClient.prompt().user(question);
        if (documentId != null && !documentId.isBlank()) {
            // The advisor param expects a filter expression string, not a Filter.Expression
            promptSpec = promptSpec.advisors(a ->
                    a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION,
                            "document_id == '" + documentId + "'"));
        }
        return promptSpec;
    }

    private Filter.Expression buildDocumentFilter(String documentId) {
        if (documentId == null || documentId.isBlank()) {
            return null;
        }
        return new FilterExpressionBuilder().eq("document_id", documentId).build();
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
