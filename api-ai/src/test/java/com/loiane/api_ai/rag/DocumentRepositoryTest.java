package com.loiane.api_ai.rag;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.JdbcTemplateAutoConfiguration;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.jdbc.Sql;

import com.loiane.api_ai.rag.model.DocumentMetadata;
import com.loiane.api_ai.rag.model.DocumentStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Integration tests for {@link DocumentRepository} against an embedded H2 database.
 *
 * <p>Runs the {@code documents} table DDL from {@code rag-schema-test.sql} (a copy of
 * the {@code id UUID} column from the production {@code rag-schema.sql}), so a
 * regression like binding a Java {@code String} to a {@code uuid} column is caught
 * here rather than only at runtime.
 */
@JdbcTest
@Import({DocumentRepositoryTest.TestConfig.class, JdbcTemplateAutoConfiguration.class})
@Sql(scripts = "classpath:rag-schema-test.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
@Sql(statements = "DELETE FROM documents", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class DocumentRepositoryTest {

    @TestConfiguration(proxyBeanMethods = false)
    @Import(DataSourceAutoConfiguration.class)
    static class TestConfig {

        @Bean
        DocumentRepository documentRepository(JdbcTemplate jdbcTemplate) {
            return new DocumentRepository(jdbcTemplate);
        }
    }

    @Autowired
    private DocumentRepository repository;

    private DocumentMetadata newDocument(String id, DocumentStatus status) {
        return new DocumentMetadata(
                id,
                "SpringAIReference.pdf",
                "application/pdf",
                331_609L,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS),
                status
        );
    }

    @Test
    void save_generatesAUuidWhenIdIsNull() {
        DocumentMetadata saved = repository.save(new DocumentMetadata(
                null, "test.pdf", "application/pdf", 1024L,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS), DocumentStatus.PROCESSING));

        assertThat(saved.id()).isNotNull();
        assertThat(UUID.fromString(saved.id())).isNotNull();
    }

    @Test
    void save_bindsAStringIdAgainstTheUuidColumnWithoutError() {
        String id = UUID.randomUUID().toString();

        DocumentMetadata saved = repository.save(newDocument(id, DocumentStatus.PROCESSING));

        assertThat(saved.id()).isEqualTo(id);
        assertThat(repository.findById(id)).isPresent();
    }

    @Test
    void findById_returnsTheSavedDocument() {
        String id = UUID.randomUUID().toString();
        repository.save(newDocument(id, DocumentStatus.READY));

        Optional<DocumentMetadata> found = repository.findById(id);

        assertThat(found).isPresent();
        assertThat(found.get().id()).isEqualTo(id);
        assertThat(found.get().filename()).isEqualTo("SpringAIReference.pdf");
        assertThat(found.get().status()).isEqualTo(DocumentStatus.READY);
    }

    @Test
    void findById_whenDocumentDoesNotExist_returnsEmpty() {
        assertThat(repository.findById(UUID.randomUUID().toString())).isEmpty();
    }

    @Test
    void save_uponConflict_updatesTheExistingRowRatherThanInserting() {
        String id = UUID.randomUUID().toString();
        repository.save(newDocument(id, DocumentStatus.PROCESSING));

        repository.save(new DocumentMetadata(
                id, "renamed.pdf", "application/pdf", 2048L,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS), DocumentStatus.READY));

        assertThat(repository.findAll()).hasSize(1);
        DocumentMetadata updated = repository.findById(id).orElseThrow();
        assertThat(updated.filename()).isEqualTo("renamed.pdf");
        assertThat(updated.status()).isEqualTo(DocumentStatus.READY);
    }

    @Test
    void findAll_ordersDocumentsByUploadDateDescending() {
        String olderId = UUID.randomUUID().toString();
        String newerId = UUID.randomUUID().toString();
        repository.save(new DocumentMetadata(olderId, "older.pdf", "application/pdf", 1L,
                LocalDateTime.now().minusDays(1).truncatedTo(ChronoUnit.SECONDS), DocumentStatus.READY));
        repository.save(new DocumentMetadata(newerId, "newer.pdf", "application/pdf", 1L,
                LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS), DocumentStatus.READY));

        assertThat(repository.findAll())
                .extracting(DocumentMetadata::id)
                .containsExactly(newerId, olderId);
    }

    @Test
    void deleteById_removesTheDocument() {
        String id = UUID.randomUUID().toString();
        repository.save(newDocument(id, DocumentStatus.READY));

        repository.deleteById(id);

        assertThat(repository.findById(id)).isEmpty();
    }

    @Test
    void deleteById_whenDocumentDoesNotExist_doesNotThrow() {
        assertThatCode(() -> repository.deleteById(UUID.randomUUID().toString()))
                .doesNotThrowAnyException();
    }

    @Test
    void updateStatus_bindsTheStringIdAgainstTheUuidColumnWithoutError() {
        String id = UUID.randomUUID().toString();
        repository.save(newDocument(id, DocumentStatus.PROCESSING));

        repository.updateStatus(id, DocumentStatus.READY);

        assertThat(repository.findById(id).orElseThrow().status()).isEqualTo(DocumentStatus.READY);
    }

    @Test
    void updateStatusWithError_setsBothStatusAndErrorMessage() {
        String id = UUID.randomUUID().toString();
        repository.save(newDocument(id, DocumentStatus.PROCESSING));

        repository.updateStatusWithError(id, DocumentStatus.ERROR, "Failed to parse PDF");

        DocumentMetadata updated = repository.findById(id).orElseThrow();
        assertThat(updated.status()).isEqualTo(DocumentStatus.ERROR);
        assertThat(updated.errorMessage()).isEqualTo("Failed to parse PDF");
    }

    @Test
    void findByStatus_returnsOnlyDocumentsWithThatStatus() {
        repository.save(newDocument(UUID.randomUUID().toString(), DocumentStatus.READY));
        repository.save(newDocument(UUID.randomUUID().toString(), DocumentStatus.PROCESSING));
        repository.save(newDocument(UUID.randomUUID().toString(), DocumentStatus.ERROR));

        assertThat(repository.findByStatus(DocumentStatus.READY)).hasSize(1);
        assertThat(repository.findByStatus(DocumentStatus.PROCESSING)).hasSize(1);
        assertThat(repository.findByStatus(DocumentStatus.ERROR)).hasSize(1);
    }

    @Test
    void count_reflectsTheNumberOfSavedDocuments() {
        assertThat(repository.count()).isZero();

        repository.save(newDocument(UUID.randomUUID().toString(), DocumentStatus.READY));
        repository.save(newDocument(UUID.randomUUID().toString(), DocumentStatus.READY));

        assertThat(repository.count()).isEqualTo(2);
    }
}
