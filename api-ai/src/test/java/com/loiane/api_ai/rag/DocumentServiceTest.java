package com.loiane.api_ai.rag;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;

import com.loiane.api_ai.rag.config.DocumentProperties;
import com.loiane.api_ai.rag.exception.DocumentNotFoundException;
import com.loiane.api_ai.rag.exception.DocumentProcessingException;
import com.loiane.api_ai.rag.model.DocumentMetadata;
import com.loiane.api_ai.rag.model.DocumentStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private VectorStore vectorStore;

    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(documentRepository, vectorStore, new DocumentProperties());
    }

    private DocumentMetadata existingDocument(String id) {
        return new DocumentMetadata(
                id, "SpringAIReference.pdf", "application/pdf", 331_609L,
                LocalDateTime.now(), DocumentStatus.READY);
    }

    @Test
    void deleteDocument_deletesVectorsScopedToTheDocumentId() {
        String documentId = "doc-123";
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(existingDocument(documentId)));

        documentService.deleteDocument(documentId);

        ArgumentCaptor<Filter.Expression> filterCaptor = ArgumentCaptor.forClass(Filter.Expression.class);
        verify(vectorStore).delete(filterCaptor.capture());
        assertThat(filterCaptor.getValue().toString()).contains("document_id").contains(documentId);
    }

    @Test
    void deleteDocument_alsoDeletesTheMetadataRow() {
        String documentId = "doc-123";
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(existingDocument(documentId)));

        documentService.deleteDocument(documentId);

        verify(documentRepository).deleteById(documentId);
    }

    @Test
    void deleteDocument_whenDocumentDoesNotExist_throwsWithoutTouchingTheVectorStore() {
        String documentId = "missing-doc";
        when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> documentService.deleteDocument(documentId))
                .isInstanceOf(DocumentNotFoundException.class);

        verify(vectorStore, never()).delete(any(Filter.Expression.class));
        verify(documentRepository, never()).deleteById(any());
    }

    @Test
    void deleteDocument_whenVectorStoreDeleteFails_propagatesAsDocumentProcessingException() {
        String documentId = "doc-123";
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(existingDocument(documentId)));
        doThrow(new RuntimeException("pgvector unavailable"))
                .when(vectorStore).delete(any(Filter.Expression.class));

        assertThatThrownBy(() -> documentService.deleteDocument(documentId))
                .isInstanceOf(DocumentProcessingException.class);

        verify(documentRepository, never()).deleteById(any());
    }
}
