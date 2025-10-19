package com.loiane.api_ai.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing document metadata in the RAG system.
 * 
 * <p>This repository provides CRUD operations for the documents table,
 * which stores metadata about uploaded documents such as filename,
 * size, upload date, and processing status.
 * 
 * <p>The actual document content is stored as vectors in the vector_store table,
 * while this repository manages only the metadata.
 * 
 * @author Loiane Groner
 * @since 1.0
 */
@Repository
public class DocumentRepository {

    private static final Logger log = LoggerFactory.getLogger(DocumentRepository.class);

    private final JdbcTemplate jdbcTemplate;
    private final DocumentRowMapper documentRowMapper;

    public DocumentRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.documentRowMapper = new DocumentRowMapper();
    }

    /**
     * Saves a new document or updates an existing one.
     * 
     * @param document The document to save
     * @return The saved document
     */
    public DocumentMetadata save(DocumentMetadata document) {
        String id = document.id() != null ? document.id() : UUID.randomUUID().toString();
        
        String sql = """
            INSERT INTO documents (id, filename, content_type, file_size, upload_date, status, error_message)
            VALUES (?, ?, ?, ?, ?, ?::VARCHAR, ?)
            ON CONFLICT (id) DO UPDATE SET
                filename = EXCLUDED.filename,
                content_type = EXCLUDED.content_type,
                file_size = EXCLUDED.file_size,
                status = EXCLUDED.status,
                error_message = EXCLUDED.error_message,
                updated_at = CURRENT_TIMESTAMP
            """;

        jdbcTemplate.update(sql,
                id,
                document.filename(),
                document.contentType(),
                document.fileSize(),
                Timestamp.valueOf(document.uploadDate()),
                document.status().name(),
                document.errorMessage()
        );

        log.debug("Saved document: id={}, filename={}, status={}", id, document.filename(), document.status());

        return new DocumentMetadata(
                id,
                document.filename(),
                document.contentType(),
                document.fileSize(),
                document.uploadDate(),
                document.status(),
                document.errorMessage()
        );
    }

    /**
     * Finds a document by its ID.
     * 
     * @param id The document ID
     * @return Optional containing the document if found, empty otherwise
     */
    public Optional<DocumentMetadata> findById(String id) {
        String sql = "SELECT * FROM documents WHERE id = ?";
        
        try {
            DocumentMetadata document = jdbcTemplate.queryForObject(sql, documentRowMapper, id);
            log.debug("Found document: id={}, filename={}", id, document.filename());
            return Optional.of(document);
        } catch (EmptyResultDataAccessException _) {
            log.debug("Document not found: id={}", id);
            return Optional.empty();
        }
    }

    /**
     * Finds all documents ordered by upload date.
     * 
     * @return List of all documents
     */
    public List<DocumentMetadata> findAll() {
        String sql = "SELECT * FROM documents ORDER BY upload_date DESC";
        List<DocumentMetadata> documents = jdbcTemplate.query(sql, documentRowMapper);
        log.debug("Found {} documents", documents.size());
        return documents;
    }

    /**
     * Deletes a document by its ID.
     * 
     * @param id The document ID to delete
     */
    public void deleteById(String id) {
        String sql = "DELETE FROM documents WHERE id = ?";
        int rowsAffected = jdbcTemplate.update(sql, id);
        
        if (rowsAffected > 0) {
            log.info("Deleted document: id={}", id);
        } else {
            log.warn("Attempted to delete non-existent document: id={}", id);
        }
    }

    /**
     * Updates the status of a document.
     * 
     * @param id The document ID
     * @param status The new status
     */
    public void updateStatus(String id, DocumentStatus status) {
        String sql = "UPDATE documents SET status = ?::VARCHAR, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        int rowsAffected = jdbcTemplate.update(sql, status.name(), id);
        
        if (rowsAffected > 0) {
            log.debug("Updated document status: id={}, status={}", id, status);
        } else {
            log.warn("Attempted to update status for non-existent document: id={}", id);
        }
    }

    /**
     * Updates the status and error message of a document.
     * 
     * @param id The document ID
     * @param status The new status
     * @param errorMessage The error message (can be null)
     */
    public void updateStatusWithError(String id, DocumentStatus status, String errorMessage) {
        String sql = "UPDATE documents SET status = ?::VARCHAR, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        int rowsAffected = jdbcTemplate.update(sql, status.name(), errorMessage, id);
        
        if (rowsAffected > 0) {
            log.debug("Updated document status with error: id={}, status={}, error={}", id, status, errorMessage);
        } else {
            log.warn("Attempted to update status for non-existent document: id={}", id);
        }
    }

    /**
     * Finds all documents with a specific status.
     * 
     * @param status The document status to filter by
     * @return List of documents with the specified status
     */
    public List<DocumentMetadata> findByStatus(DocumentStatus status) {
        String sql = "SELECT * FROM documents WHERE status = ?::VARCHAR ORDER BY upload_date DESC";
        List<DocumentMetadata> documents = jdbcTemplate.query(sql, documentRowMapper, status.name());
        log.debug("Found {} documents with status: {}", documents.size(), status);
        return documents;
    }

    /**
     * Counts the total number of documents.
     * 
     * @return Total document count
     */
    public long count() {
        String sql = "SELECT COUNT(*) FROM documents";
        Long count = jdbcTemplate.queryForObject(sql, Long.class);
        return count != null ? count : 0L;
    }

    /**
     * RowMapper for converting database rows to DocumentMetadata objects.
     */
    private static class DocumentRowMapper implements RowMapper<DocumentMetadata> {
        @Override
        public DocumentMetadata mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new DocumentMetadata(
                    rs.getString("id"),
                    rs.getString("filename"),
                    rs.getString("content_type"),
                    rs.getLong("file_size"),
                    rs.getTimestamp("upload_date").toLocalDateTime(),
                    DocumentStatus.valueOf(rs.getString("status")),
                    rs.getString("error_message")
            );
        }
    }
}
