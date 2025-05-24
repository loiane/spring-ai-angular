package com.loiane.api_ai.memory;

import com.loiane.api_ai.chat.ChatRequest;
import com.loiane.api_ai.chat.ChatResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat-memory")
public class MemoryChatController {

    private final MemoryChatService memoryChatService;

    public MemoryChatController(MemoryChatService memoryChatService) {
        this.memoryChatService = memoryChatService;
    }

    @GetMapping
    public List<Map<String, Object>> getAllChats() {
        return this.memoryChatService.getAllChats();
    }

    @PostMapping
    public String createChat() {
        return this.memoryChatService.createChat();
    }

    @PostMapping("/{chatId}")
    public ChatResponse chatMemory(@PathVariable String chatId, @RequestBody ChatRequest request) {
        return new ChatResponse(this.memoryChatService.chat(chatId, request.message()));
    }
}
