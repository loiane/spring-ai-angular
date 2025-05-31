package com.loiane.api_ai.memory;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.repository.jdbc.JdbcChatMemoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MemoryChatService {

    private final ChatClient chatClient;

    private final ChatMemoryIDRepository chatMemoryRepository;

    public MemoryChatService(ChatClient.Builder chatClientBuilder,
                             JdbcChatMemoryRepository jdbcChatMemoryRepository, ChatMemoryIDRepository chatMemoryRepository) {

        this.chatMemoryRepository = chatMemoryRepository;

        ChatMemory chatMemory = MessageWindowChatMemory.builder()
                .chatMemoryRepository(jdbcChatMemoryRepository)
                .maxMessages(10)
                .build();

        this.chatClient = chatClientBuilder
                .defaultAdvisors(
                        MessageChatMemoryAdvisor.builder(chatMemory).build(),
                        new SimpleLoggerAdvisor()
                )
                .build();

    }

    public String createChat() {
        return this.chatMemoryRepository.generateChatId("Loiane");
    }

    public List<Chat> getAllChats() {
        return this.chatMemoryRepository.getAllChatsForUser("Loiane");
    }

    public List<ChatMessage> getChatMessages(String userId) {
        return this.chatMemoryRepository.getChatMessages(userId);
    }

    public String chat(String chatId, String message) {
        var response = this.chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, chatId))
                .call()
                .content();
        this.updateDescription(chatId, message);
        return response;
    }

    private void updateDescription(String chatId, String message) {
        if (this.chatMemoryRepository.chatIdExists(chatId)) {
            String description = this.generateDescription(message);
            this.chatMemoryRepository.updateDescription(chatId, description);
        }
    }

    private String generateDescription(String message) {
        return this.chatClient.prompt()
                .user("Generate a chat description based on the message, limiting the description to 30 characters: " + message)
                .call()
                .content();
    }

}
