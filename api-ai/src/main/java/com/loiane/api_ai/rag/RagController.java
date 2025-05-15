package com.loiane.api_ai.rag;

import com.loiane.api_ai.chat.ChatRequest;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/ai/rag")
public class RagController {

    private final RagPDFReader ragPDFReader;
    private final VectorStore vectorStore;
    private final ChatClient chatClient;

    public RagController(RagPDFReader ragPDFReader, EmbeddingModel embeddingModel,
                         ChatClient.Builder chatClientBuilder) {
        this.ragPDFReader = ragPDFReader;
        this.vectorStore = SimpleVectorStore.builder(embeddingModel).build();
        this.chatClient = chatClientBuilder.build();
    }

    @GetMapping("load-pdf")
    public void getPdf() {
        List<Document> docs = this.ragPDFReader.getDocsFromPdf();
        System.out.println("docs.size() = " + docs.size());
        vectorStore.add(docs);
    }

    @PostMapping
    public String chat(@RequestBody ChatRequest request) {
        return this.chatClient.prompt()
                .user(request.message())
                .advisors(new QuestionAnswerAdvisor(vectorStore))
                .call()
                .content();
    }
}
