package com.loiane.api_ai.rag;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.pgvector.PgVectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Configuration class for the PgVectorStore used in RAG (Retrieval-Augmented Generation).
 * 
 * <p>This configuration sets up the vector database for storing and retrieving
 * document embeddings. It uses PostgreSQL with the pgvector extension for
 * efficient similarity search.
 * 
 * <p>Key features:
 * <ul>
 *   <li>Uses OpenAI embeddings (1536 dimensions)</li>
 *   <li>Cosine distance for similarity search</li>
 *   <li>HNSW index for optimal performance</li>
 *   <li>Persistent storage (no table dropping on restart)</li>
 * </ul>
 * 
 * @author Loiane Groner
 * @since 1.0
 */
@Configuration
public class VectorStoreConfig {

    @Value("${spring.ai.vectorstore.pgvector.dimensions:1536}")
    private int dimensions;

    @Value("${spring.ai.vectorstore.pgvector.distance-type:COSINE_DISTANCE}")
    private String distanceType;

    @Value("${spring.ai.vectorstore.pgvector.remove-existing-vector-store-table:false}")
    private boolean removeExistingVectorStoreTable;

    @Value("${spring.ai.vectorstore.pgvector.index-type:HNSW}")
    private String indexType;

    @Value("${spring.ai.vectorstore.pgvector.initialize-schema:false}")
    private boolean initializeSchema;

    /**
     * Creates and configures the PgVectorStore bean for document embeddings.
     * 
     * <p>This vector store is used to:
     * <ul>
     *   <li>Store document embeddings generated from uploaded PDFs</li>
     *   <li>Perform similarity search to find relevant document chunks</li>
     *   <li>Support RAG queries with contextual information</li>
     * </ul>
     * 
     * <p>Configuration:
     * <ul>
     *   <li>Dimensions: 1536 (OpenAI text-embedding-3-small)</li>
     *   <li>Distance: COSINE (for similarity calculation)</li>
     *   <li>Index: HNSW (Hierarchical Navigable Small World for fast search)</li>
     *   <li>Schema: Managed externally via SQL scripts</li>
     * </ul>
     * 
     * @param jdbcTemplate JDBC template for database operations
     * @param embeddingModel The embedding model (OpenAI) for generating vectors
     * @return Configured PgVectorStore instance
     */
    @Bean
    public VectorStore vectorStore(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        return PgVectorStore.builder(jdbcTemplate, embeddingModel)
                .dimensions(dimensions)
                .distanceType(PgVectorStore.PgDistanceType.valueOf(distanceType))
                .removeExistingVectorStoreTable(removeExistingVectorStoreTable)
                .indexType(PgVectorStore.PgIndexType.valueOf(indexType))
                .initializeSchema(initializeSchema)
                .build();
    }
}
