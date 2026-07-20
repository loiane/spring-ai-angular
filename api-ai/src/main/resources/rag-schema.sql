-- RAG (Retrieval-Augmented Generation) Database Schema
-- This schema supports document upload metadata and RAG queries.
-- Note: vector embeddings are stored in a local SimpleVectorStore file, not this database.

-- Drop existing tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS documents CASCADE;

-- =============================================
-- Documents Table
-- Stores metadata about uploaded documents
-- =============================================
CREATE TABLE documents (
    id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Note: status is validated in Java via the DocumentStatus enum, not a DB CHECK
-- constraint. H2 2.4.240 has a connection-lifecycle bug (constraint's compiled
-- expression caches a session reference) that makes `CHECK status IN (...)`
-- intermittently throw "Check constraint invalid" after the DDL connection is
-- recycled by a connection pool. Not an issue with a small, fixed set of values
-- enforced at the application layer.

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);

-- Note: updated_at is maintained by the application (DocumentRepository sets
-- CURRENT_TIMESTAMP explicitly on updates) since H2 doesn't support PL/pgSQL triggers.

-- =============================================
-- Sample Queries (for reference)
-- =============================================

-- Find documents by user
-- SELECT * FROM documents WHERE user_id = 'user123' ORDER BY upload_date DESC;

-- Find ready documents
-- SELECT * FROM documents WHERE status = 'READY';

-- Count documents by status
-- SELECT status, COUNT(*) FROM documents GROUP BY status;
