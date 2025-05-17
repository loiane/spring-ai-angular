package com.loiane.api_ai.rag;

import com.loiane.api_ai.chat.ChatRequest;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/ai/rag")
public class RagController {

    private final VectorStore vectorStore;

    private final ChatClient chatClient;

    public RagController(ChatClient.Builder chatClientBuilder,  @Qualifier("simpleVectorStore") VectorStore vectorStore) {
        this.vectorStore = vectorStore;
        this.chatClient = chatClientBuilder.build();
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
