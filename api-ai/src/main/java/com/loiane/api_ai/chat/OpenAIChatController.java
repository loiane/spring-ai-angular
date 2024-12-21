package com.loiane.api_ai.chat;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/openai")
public class OpenAIChatController {

    private final ChatClient chatClient;
    private final ChatClient chatClientMemory;

    public OpenAIChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
        this.chatClientMemory = chatClientBuilder
                .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory())).build();
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody String message) {
        var response = this.chatClient.prompt()
                .user(message)
                .call()
                .content();
        return new ChatResponse(response);
    }

    @PostMapping("/chat-memory")
    public ChatResponse chatMemory(@RequestBody String message) {
        var response = this.chatClientMemory.prompt()
                .user(message)
                .call()
                .content();
        return new ChatResponse(response);
    }
}
