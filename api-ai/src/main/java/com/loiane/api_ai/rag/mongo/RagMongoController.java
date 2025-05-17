package com.loiane.api_ai.rag.mongo;

import org.springframework.ai.document.Document;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/ai/rag-mongo")
public class RagMongoController {

    private final VectorStore vectorStore;
    private final JdbcClient jdbcClient;

    private final ChatClient chatClient;

    public RagMongoController(ChatClient.Builder chatClientBuilder, VectorStore vectorStore, JdbcClient jdbcClient) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
        this.jdbcClient = jdbcClient;
    }

    @GetMapping
    public String get() {
//        Integer count = jdbcClient.sql("select count(*) from vector_store")
//                .query(Integer.class)
//                .single();
//        return "Count: " + count;

        List<Document> documents = List.of(
                new Document("Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!! Spring AI rocks!!", Map.of("meta1", "meta1")),
                new Document("The World is Big and Salvation Lurks Around the Corner"),
                new Document("You walk forward facing the past and you turn back toward the future.", Map.of("meta2", "meta2")));

// Add the documents to MongoDB Atlas
        vectorStore.add(documents);

// Retrieve documents similar to a query
        List<Document> results = vectorStore.similaritySearch(SearchRequest.builder().query("Spring").topK(5).build());

        String result = results.stream()
                .map(Document::getFormattedContent)
                .collect(Collectors.joining("\n"));

        return result;
    }
}
