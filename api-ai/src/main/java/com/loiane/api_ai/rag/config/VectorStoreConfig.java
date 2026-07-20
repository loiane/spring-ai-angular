package com.loiane.api_ai.rag.config;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Configuration class for the VectorStore used in RAG (Retrieval-Augmented Generation).
 *
 * <p>Uses Spring AI's {@link SimpleVectorStore}, an in-memory store persisted to a
 * local JSON file. This keeps local development free of external database
 * dependencies (no Docker/Postgres/pgvector required).
 *
 * @author Loiane Groner
 * @since 1.0
 */
@Configuration
public class VectorStoreConfig {

    @Value("${app.vectorstore.file:./data/vectorstore.json}")
    private String vectorStoreFilePath;

    @Bean
    @Primary
    public VectorStore vectorStore(EmbeddingModel embeddingModel) throws IOException {
        File vectorStoreFile = new File(vectorStoreFilePath);
        Path parentDir = vectorStoreFile.getAbsoluteFile().toPath().getParent();
        if (parentDir != null) {
            Files.createDirectories(parentDir);
        }

        SimpleVectorStore vectorStore = SimpleVectorStore.builder(embeddingModel).build();
        if (vectorStoreFile.exists()) {
            vectorStore.load(vectorStoreFile);
        }
        return vectorStore;
    }
}
