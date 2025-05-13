package com.loiane.api_ai.chat.memory;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChatMemoryIDRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChatMemoryIDRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String generateChatId(String userId) {
        String sql = "INSERT INTO chat_memory (user_id, id) VALUES (?, ?)";
        String chatId = generateUniqueChatId();
        jdbcTemplate.update(sql, userId, chatId);
        return chatId;
    }

    private String generateUniqueChatId() {
        return java.util.UUID.randomUUID().toString();
    }
}
