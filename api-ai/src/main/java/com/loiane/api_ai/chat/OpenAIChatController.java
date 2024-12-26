package com.loiane.api_ai.chat;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/openai")
public class OpenAIChatController {

    private final SimpleChatService simpleChatService;
    private final MemoryChatService memoryChatService;

    public OpenAIChatController(SimpleChatService simpleChatService, MemoryChatService memoryChatService) {
        this.simpleChatService = simpleChatService;
        this.memoryChatService = memoryChatService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody String message) {
        return new ChatResponse(this.simpleChatService.chat(message));
    }

    @PostMapping("/chat-memory")
    public ChatResponse chatMemory(@RequestBody String message) {
        return new ChatResponse(this.memoryChatService.chat(message));
    }
}
