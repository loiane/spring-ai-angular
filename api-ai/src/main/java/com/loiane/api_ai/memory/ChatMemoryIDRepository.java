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

    public String generateChatId(String userId, String description) {
        String sql = "INSERT INTO chat_memory (user_id, description) VALUES (?, ?) RETURNING conversation_id";
        return jdbcTemplate.queryForObject(sql, String.class, userId, description);
    }

    public boolean chatIdExists(String chatId) {
        String sql = "SELECT COUNT(*) FROM chat_memory WHERE conversation_id = ?::uuid";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, chatId);
        return count != null && count == 1;
    }
    
    public List<Chat> getAllChatsForUser(String userId) {
        String sql = "SELECT conversation_id, description FROM chat_memory WHERE user_id = ? ORDER BY conversation_id DESC";
        return jdbcTemplate.query(sql, (rs, _) -> new Chat(rs.getString("conversation_id"), rs.getString("description")), userId);
    }

    public List<ChatMessage> getChatMessages(String chatId) {
        String sql = "SELECT content, type FROM spring_ai_chat_memory WHERE conversation_id = ? ORDER BY timestamp ASC";
        return jdbcTemplate.query(sql, (rs, _) -> new ChatMessage(rs.getString("content"), rs.getString("type")), chatId);
    }
}
