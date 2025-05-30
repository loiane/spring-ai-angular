package com.loiane.api_ai.memory;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

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

    public boolean chatIdExists(String chatId) {
        String sql = "SELECT COUNT(*) FROM spring_ai_chat_memory WHERE conversation_id = ? AND type = 'USER'";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, chatId);
        return count != null && count == 1;
    }

    public void updateDescription(String chatId, String description) {
        String sql = "UPDATE chat_memory SET description = ? WHERE id = ?";
        jdbcTemplate.update(sql, description, chatId);
    }

    public List<Map<String, Object>> getAllChatsForUser(String userId) {
        String sql = "SELECT id, description, user_id FROM chat_memory WHERE user_id = ? ORDER BY id DESC";
        return jdbcTemplate.queryForList(sql, userId);
    }
}
