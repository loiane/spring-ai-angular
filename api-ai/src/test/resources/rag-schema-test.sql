-- Mirrors the "documents" table from src/main/resources/rag-schema.sql, minus the
-- update_updated_at_column trigger: H2 doesn't support PL/pgSQL, and
-- DocumentRepository doesn't rely on it (it sets updated_at explicitly).
-- Also omits the chk_status CHECK constraint - see rag-schema.sql for why.

DROP TABLE IF EXISTS documents CASCADE;

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

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
