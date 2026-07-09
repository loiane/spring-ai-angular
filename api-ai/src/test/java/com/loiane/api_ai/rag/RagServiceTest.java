package com.loiane.api_ai.rag;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import com.loiane.api_ai.rag.config.DocumentProperties;
import com.loiane.api_ai.rag.model.RagResponse;
import com.loiane.api_ai.rag.model.RagStreamEvent;

import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link RagService}.
 *
 * <p>Exercises the RAG pipeline against mocked {@link ChatClient} and
 * {@link VectorStore} collaborators, verifying:
 * <ul>
 *   <li>Retrieval is scoped to a single document via the advisor filter expression
 *       when a documentId is supplied, and unscoped otherwise</li>
 *   <li>The refusal sentence produced by the grounded prompt suppresses source
 *       citations, for both the synchronous and streaming pipelines</li>
 *   <li>Errors from the chat client are converted into a friendly error response
 *       instead of propagating</li>
 *   <li>Source extraction deduplicates by document id and truncates long chunks</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class RagServiceTest {

    private static final String REFUSAL_MESSAGE =
            "I'm sorry, I can only answer questions about the uploaded document, and I couldn't find that information in it.";

    @Mock
    private VectorStore vectorStore;

    @Mock
    private DocumentProperties documentProperties;

    private ChatClient.ChatClientRequestSpec requestSpec;
    private ChatClient.CallResponseSpec callResponseSpec;
    private ChatClient.StreamResponseSpec streamResponseSpec;

    private RagService ragService;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        lenient().when(documentProperties.getTopK()).thenReturn(5);

        ChatClient chatClient = mock(ChatClient.class);
        requestSpec = mock(ChatClient.ChatClientRequestSpec.class);
        callResponseSpec = mock(ChatClient.CallResponseSpec.class);
        streamResponseSpec = mock(ChatClient.StreamResponseSpec.class);

        when(chatClient.prompt()).thenReturn(requestSpec);
        when(requestSpec.user(anyString())).thenReturn(requestSpec);
        lenient().when(requestSpec.advisors(any(Consumer.class))).thenReturn(requestSpec);
        lenient().when(requestSpec.call()).thenReturn(callResponseSpec);
        lenient().when(requestSpec.stream()).thenReturn(streamResponseSpec);

        ChatClient.Builder chatClientBuilder = mock(ChatClient.Builder.class);
        when(chatClientBuilder.defaultAdvisors(any(Advisor.class))).thenReturn(chatClientBuilder);
        when(chatClientBuilder.build()).thenReturn(chatClient);

        ragService = new RagService(chatClientBuilder, vectorStore, documentProperties);
    }

    private Document documentChunk(String documentId, String filename, String content) {
        return Document.builder()
                .text(content)
                .metadata(Map.of("document_id", documentId, "filename", filename))
                .build();
    }

    /**
     * Captures the {@code Consumer<AdvisorSpec>} passed to {@code requestSpec.advisors(...)}
     * and invokes it against a fresh mock, returning that mock so the {@code param(...)}
     * call it received can be verified.
     */
    @SuppressWarnings("unchecked")
    private ChatClient.AdvisorSpec captureAppliedAdvisorSpec() {
        ArgumentCaptor<Consumer<ChatClient.AdvisorSpec>> advisorCaptor = ArgumentCaptor.forClass(Consumer.class);
        verify(requestSpec).advisors(advisorCaptor.capture());

        ChatClient.AdvisorSpec advisorSpec = mock(ChatClient.AdvisorSpec.class);
        advisorCaptor.getValue().accept(advisorSpec);
        return advisorSpec;
    }

    @Test
    void askQuestion_withDocumentId_scopesAdvisorFilterToThatDocument() {
        when(callResponseSpec.content()).thenReturn("Spring AI simplifies building AI applications.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of());

        ragService.askQuestion("What is Spring AI?", "doc-123");

        ChatClient.AdvisorSpec advisorSpec = captureAppliedAdvisorSpec();
        verify(advisorSpec).param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "document_id == 'doc-123'");

        ArgumentCaptor<SearchRequest> searchCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore).similaritySearch(searchCaptor.capture());
        assertThat(searchCaptor.getValue().getFilterExpression()).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void askQuestion_withoutDocumentId_doesNotScopeAdvisor() {
        when(callResponseSpec.content()).thenReturn("A general answer.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of());

        ragService.askQuestion("What is the weather?", null);

        verify(requestSpec, never()).advisors(any(Consumer.class));

        ArgumentCaptor<SearchRequest> searchCaptor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore).similaritySearch(searchCaptor.capture());
        assertThat(searchCaptor.getValue().getFilterExpression()).isNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void askQuestion_withBlankDocumentId_treatsItAsUnscoped() {
        when(callResponseSpec.content()).thenReturn("A general answer.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of());

        ragService.askQuestion("What is the weather?", "   ");

        verify(requestSpec, never()).advisors(any(Consumer.class));
    }

    @Test
    void askQuestion_whenModelRefuses_returnsRefusalWithNoSources() {
        when(callResponseSpec.content()).thenReturn(REFUSAL_MESSAGE);

        RagResponse response = ragService.askQuestion("What is the capital of France?", "doc-123");

        assertThat(response.answer()).isEqualTo(REFUSAL_MESSAGE);
        assertThat(response.sources()).isEmpty();
        verify(vectorStore, never()).similaritySearch(any(SearchRequest.class));
    }

    @Test
    void askQuestion_whenAnswerIsGrounded_returnsAnswerWithSources() {
        when(callResponseSpec.content()).thenReturn("Spring AI provides portable AI APIs.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(
                documentChunk("doc-123", "SpringAIReference.pdf", "Spring AI is a project...")
        ));

        RagResponse response = ragService.askQuestion("What is Spring AI?", "doc-123");

        assertThat(response.answer()).isEqualTo("Spring AI provides portable AI APIs.");
        assertThat(response.sources()).hasSize(1);
        assertThat(response.sources().getFirst().filename()).isEqualTo("SpringAIReference.pdf");
    }

    @Test
    void askQuestion_whenChatClientThrows_returnsFriendlyErrorResponse() {
        when(requestSpec.call()).thenThrow(new RuntimeException("upstream failure"));

        RagResponse response = ragService.askQuestion("What is Spring AI?", "doc-123");

        assertThat(response.answer())
                .isEqualTo("Sorry, I encountered an error while processing your question. Please try again.");
        assertThat(response.sources()).isEmpty();
    }

    @Test
    void askQuestion_deduplicatesSourcesByDocumentId() {
        when(callResponseSpec.content()).thenReturn("Answer.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(
                documentChunk("doc-1", "a.pdf", "First chunk from doc 1"),
                documentChunk("doc-1", "a.pdf", "Second chunk from doc 1"),
                documentChunk("doc-2", "b.pdf", "Chunk from doc 2")
        ));

        RagResponse response = ragService.askQuestion("question", null);

        assertThat(response.sources()).hasSize(2);
        assertThat(response.sources()).extracting("filename").containsExactly("a.pdf", "b.pdf");
    }

    @Test
    void askQuestion_truncatesLongSourceSnippets() {
        String longContent = "x".repeat(250);
        when(callResponseSpec.content()).thenReturn("Answer.");
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(
                documentChunk("doc-1", "a.pdf", longContent)
        ));

        RagResponse response = ragService.askQuestion("question", null);

        String snippet = response.sources().getFirst().content();
        assertThat(snippet).hasSize(203);
        assertThat(snippet).endsWith("...");
    }

    @Test
    void askQuestionStream_emitsAnswerDeltasFollowedByTerminalSourcesEvent() {
        when(streamResponseSpec.content()).thenReturn(Flux.just("Spring ", "AI ", "is great."));
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of(
                documentChunk("doc-123", "SpringAIReference.pdf", "Spring AI is a project...")
        ));

        Flux<RagStreamEvent> stream = ragService.askQuestionStream("What is Spring AI?", "doc-123");

        StepVerifier.create(stream)
                .expectNext(RagStreamEvent.answer("Spring "))
                .expectNext(RagStreamEvent.answer("AI "))
                .expectNext(RagStreamEvent.answer("is great."))
                .assertNext(event -> {
                    assertThat(event.type()).isEqualTo("sources");
                    assertThat(event.sources()).hasSize(1);
                    assertThat(event.sources().getFirst().filename()).isEqualTo("SpringAIReference.pdf");
                })
                .verifyComplete();
    }

    @Test
    void askQuestionStream_scopesAdvisorFilterToDocument_sameAsSyncPath() {
        when(streamResponseSpec.content()).thenReturn(Flux.just("answer"));
        when(vectorStore.similaritySearch(any(SearchRequest.class))).thenReturn(List.of());

        StepVerifier.create(ragService.askQuestionStream("question", "doc-999"))
                .expectNextCount(2)
                .verifyComplete();

        ChatClient.AdvisorSpec advisorSpec = captureAppliedAdvisorSpec();
        verify(advisorSpec).param(QuestionAnswerAdvisor.FILTER_EXPRESSION, "document_id == 'doc-999'");
    }

    @Test
    void askQuestionStream_whenAnswerIsRefusal_terminalSourcesEventIsEmpty() {
        when(streamResponseSpec.content()).thenReturn(Flux.just(REFUSAL_MESSAGE));

        Flux<RagStreamEvent> stream = ragService.askQuestionStream("What is the capital of France?", "doc-123");

        StepVerifier.create(stream)
                .expectNext(RagStreamEvent.answer(REFUSAL_MESSAGE))
                .assertNext(event -> {
                    assertThat(event.type()).isEqualTo("sources");
                    assertThat(event.sources()).isEmpty();
                })
                .verifyComplete();

        verify(vectorStore, never()).similaritySearch(any(SearchRequest.class));
    }

    @Test
    void askQuestionStream_whenUpstreamErrors_emitsFriendlyErrorAndEmptySources() {
        when(streamResponseSpec.content())
                .thenReturn(Flux.error(new RuntimeException("model unavailable")));

        Flux<RagStreamEvent> stream = ragService.askQuestionStream("question", null);

        StepVerifier.create(stream)
                .assertNext(event -> assertThat(event.content())
                        .isEqualTo("Sorry, I encountered an error while processing your question. Please try again."))
                .assertNext(event -> {
                    assertThat(event.type()).isEqualTo("sources");
                    assertThat(event.sources()).isEmpty();
                })
                .verifyComplete();
    }
}
