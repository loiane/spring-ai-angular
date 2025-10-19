-- RAG (Retrieval-Augmented Generation) Database Schema
-- This schema supports document upload, vector storage, and RAG queries
-- Note: vector extension and vector_store table are created in pgvector.sql

-- Drop existing tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS documents CASCADE;

-- =============================================
-- Documents Table
-- Stores metadata about uploaded documents
-- =============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('PROCESSING', 'READY', 'ERROR'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);

-- =============================================
-- Helper Function: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on documents table
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Sample Queries (for reference)
-- =============================================

-- Find documents by user
-- SELECT * FROM documents WHERE user_id = 'user123' ORDER BY upload_date DESC;

-- Find ready documents
-- SELECT * FROM documents WHERE status = 'READY';

-- Count documents by status
-- SELECT status, COUNT(*) FROM documents GROUP BY status;
