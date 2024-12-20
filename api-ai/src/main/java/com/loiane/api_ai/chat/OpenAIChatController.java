package com.loiane.api_ai.chat;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/openai")
public class OpenAIChatController {

    private final ChatClient chatClient;

    record ChatResponse(String message){}

    public OpenAIChatController(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody String message) {
        var response = this.chatClient.prompt()
                .user(message)
                .call()
                .content();
        return new ChatResponse(response);
    }
}
