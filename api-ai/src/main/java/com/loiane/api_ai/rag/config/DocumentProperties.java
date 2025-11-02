package com.loiane.api_ai.rag.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for document processing and RAG functionality.
 * Maps properties from application.properties with prefix "app.documents".
 */
@Component
@ConfigurationProperties(prefix = "app.documents")
public class DocumentProperties {

    /**
     * Directory path where uploaded documents are stored.
     * Default: ./documents
     */
    private String uploadDir = "./documents";

    /**
     * Maximum chunk size for text splitting in tokens.
     * Larger chunks provide more context but may be less precise.
     * Default: 800 tokens
     */
    private int chunkSize = 800;

    /**
     * Minimum chunk size in characters.
     * Prevents creating very small, meaningless chunks.
     * Default: 350 characters
     */
    private int minChunkSize = 350;

    /**
     * Chunk overlap in tokens.
     * Maintains continuity between adjacent chunks.
     * Default: 50 tokens
     */
    private int chunkOverlap = 50;

    /**
     * Number of similar chunks to retrieve for RAG queries (top-k).
     * Higher values provide more context but may introduce noise.
     * Default: 5 chunks
     */
    private int topK = 5;

    // Getters and Setters

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public int getChunkSize() {
        return chunkSize;
    }

    public void setChunkSize(int chunkSize) {
        this.chunkSize = chunkSize;
    }

    public int getMinChunkSize() {
        return minChunkSize;
    }

    public void setMinChunkSize(int minChunkSize) {
        this.minChunkSize = minChunkSize;
    }

    public int getChunkOverlap() {
        return chunkOverlap;
    }

    public void setChunkOverlap(int chunkOverlap) {
        this.chunkOverlap = chunkOverlap;
    }

    public int getTopK() {
        return topK;
    }

    public void setTopK(int topK) {
        this.topK = topK;
    }

    @Override
    public String toString() {
        return "DocumentProperties{" +
                "uploadDir='" + uploadDir + '\'' +
                ", chunkSize=" + chunkSize +
                ", minChunkSize=" + minChunkSize +
                ", chunkOverlap=" + chunkOverlap +
                ", topK=" + topK +
                '}';
    }
}
