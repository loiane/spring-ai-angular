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
    public List<Chat> getAllChats() {
        return this.memoryChatService.getAllChats();
    }

    @GetMapping("/{chatId}")
    public List<ChatMessage> getChatMessages(@PathVariable String chatId) {
        return this.memoryChatService.getChatMessages(chatId);
    }

    @PostMapping
    public Chat createChat() {
        return new Chat(this.memoryChatService.createChat(),"...");
    }

    @PostMapping("/{chatId}")
    public ChatMessage chatMemory(@PathVariable String chatId, @RequestBody ChatRequest request) {
        return new ChatMessage(this.memoryChatService.chat(chatId, request.message()), "USER");
    }
}
