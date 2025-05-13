package com.loiane.api_ai.chat;

import com.loiane.api_ai.chat.memory.MemoryChatService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final SimpleChatService simpleChatService;
    private final MemoryChatService memoryChatService;

    public ChatController(SimpleChatService simpleChatService, MemoryChatService memoryChatService) {
        this.simpleChatService = simpleChatService;
        this.memoryChatService = memoryChatService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        return new ChatResponse(this.simpleChatService.chat(request.message()));
    }

    @PostMapping("/chat-memory")
    public ChatResponse chatMemory(@RequestBody ChatRequest request) {
        return new ChatResponse(this.memoryChatService.chat(request.message()));
    }
}
