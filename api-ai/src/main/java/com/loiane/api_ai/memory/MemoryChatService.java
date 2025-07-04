package com.loiane.api_ai.memory;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemoryChatService {

    private final ChatClient chatClient;

    private final ChatMemoryIDRepository chatMemoryRepository;

    private static final String DEFAULT_USER_ID = "Loiane";
    private static final String DESCRIPTION_PROMPT = "Generate a chat description based on the message, limiting the description to 30 characters: ";

    public MemoryChatService(ChatClient.Builder chatClientBuilder,
                             JdbcChatMemoryRepository jdbcChatMemoryRepository, ChatMemoryIDRepository chatMemoryRepository) {

        this.chatMemoryRepository = chatMemoryRepository;

        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepository)
                .maxMessages(10)
                .build();

        this.chatClient = chatClientBuilder
                .defaultAdvisors(
                        MessageChatMemoryAdvisor.builder(chatMemory).build()
                )
                .build();

    }

    public String createChat(String message) {
        String description = this.generateDescription(message);
        return this.chatMemoryRepository.generateChatId(DEFAULT_USER_ID, description);
    }

    public ChatStartResponse createChatWithResponse(String message) {
        String description = this.generateDescription(message);
        String chatId = this.chatMemoryRepository.generateChatId(DEFAULT_USER_ID, description);
        String response = this.chat(chatId, message);
        return new ChatStartResponse(chatId, response, description);
    }

    public List<Chat> getAllChats() {
        return this.chatMemoryRepository.getAllChatsForUser(DEFAULT_USER_ID);
    }

    public List<ChatMessage> getChatMessages(String userId) {
        return this.chatMemoryRepository.getChatMessages(userId);
    }

    public String chat(String chatId, String message) {
        if (!this.chatMemoryRepository.chatIdExists(chatId)) {
            throw new IllegalArgumentException("Chat ID does not exist: " + chatId);
        }
        
        return this.chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, chatId))
                .call()
                .content();
    }

    private String generateDescription(String message) {
        return this.chatClient.prompt()
                .user(DESCRIPTION_PROMPT + message)
                .call()
                .content();
    }

}
