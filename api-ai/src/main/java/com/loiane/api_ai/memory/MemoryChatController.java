package com.loiane.api_ai.memory;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loiane.api_ai.chat.ChatRequest;

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

    @PostMapping("/start")
    public ChatStartResponse startNewChat(@RequestBody ChatRequest request) {
        return this.memoryChatService.createChatWithResponse(request.message());
    }

    @PostMapping("/{chatId}")
    public ChatMessage chatMemory(@PathVariable String chatId, @RequestBody ChatRequest request) {
        return new ChatMessage(this.memoryChatService.chat(chatId, request.message()), "ASSISTANT");
    }
}
