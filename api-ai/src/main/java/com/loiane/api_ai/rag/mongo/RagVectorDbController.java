package com.loiane.api_ai.rag.mongo;

import com.loiane.api_ai.chat.ChatRequest;
import org.springframework.ai.document.Document;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("api/ai/rag-mongo")
public class RagVectorDbController {

    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public RagVectorDbController(ChatClient.Builder chatClientBuilder, VectorStore vectorStore) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping
    public String get(@RequestBody ChatRequest request) {

        // Retrieve documents similar to a query
        List<Document> results = vectorStore.similaritySearch(SearchRequest.builder().query(request.message()).topK(2).build());

        assert results != null;
        return results.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n"));
    }
}
