package com.loiane.api_ai.memory;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ChatMemoryIDRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChatMemoryIDRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String generateChatId(String userId) {
        String sql = "INSERT INTO chat_memory (user_id) VALUES (?) RETURNING id";
        return jdbcTemplate.queryForObject(sql, String.class, userId);
    }

    public boolean chatIdExists(String chatId) {
        String sql = "SELECT COUNT(*) FROM spring_ai_chat_memory WHERE conversation_id = ? AND type = 'USER'";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, chatId);
        return count != null && count == 1;
    }

    public void updateDescription(String chatId, String description) {
        String sql = "UPDATE chat_memory SET description = ? WHERE id = ?::uuid";
        jdbcTemplate.update(sql, description, chatId);
    }

    public List<Chat> getAllChatsForUser(String userId) {
        String sql = "SELECT id, description FROM chat_memory WHERE user_id = ? AND description IS NOT NULL ORDER BY id DESC";
        return jdbcTemplate.query(sql, (rs, _) -> new Chat(rs.getString("id"), rs.getString("description")), userId);
    }

    public List<ChatMessage> getChatMessages(String chatId) {
        String sql = "SELECT content, type FROM spring_ai_chat_memory WHERE conversation_id = ? ORDER BY timestamp ASC";
        return jdbcTemplate.query(sql, (rs, _) -> new ChatMessage(rs.getString("content"), rs.getString("type")), chatId);
    }
}
