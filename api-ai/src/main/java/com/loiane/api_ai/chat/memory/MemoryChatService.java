package com.loiane.api_ai.chat.memory;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.memory.jdbc.JdbcChatMemoryRepository;
import org.springframework.stereotype.Service;

@Service
public class MemoryChatService {

    private ChatMemory chatMemory;

    private JdbcChatMemoryRepository jdbcChatMemoryRepository;

    private final ChatClient chatClient;

    private final ChatMemoryIDRepository chatMemoryRepository;

    public MemoryChatService(ChatClient.Builder chatClientBuilder, ChatMemory chatMemory,
                             JdbcChatMemoryRepository jdbcChatMemoryRepository, ChatMemoryIDRepository chatMemoryRepository) {
        this.chatMemory = chatMemory;
        this.jdbcChatMemoryRepository = jdbcChatMemoryRepository;

        this.chatMemoryRepository = chatMemoryRepository;

        this.chatMemory = MessageWindowChatMemory.builder()
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

    public String chat(String message) {
        String chatId = this.chatMemoryRepository.generateChatId("Loiane");

        return this.chatClient.prompt()
                .user(message)
                .advisors(a -> a.param(AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY, chatId))
                .call()
                .content();
    }
}
