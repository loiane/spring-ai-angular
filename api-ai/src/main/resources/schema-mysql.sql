CREATE TABLE IF NOT EXISTS SPRING_AI_CHAT_MEMORY (
                                                     `conversation_id` VARCHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `type` ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL') NOT NULL,
    `timestamp` TIMESTAMP NOT NULL,

    INDEX `SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_TIMESTAMP_IDX` (`conversation_id`, `timestamp`)
    );

-- Chat table for storing conversation metadata
CREATE TABLE IF NOT EXISTS CHAT (
    `id` VARCHAR(36) DEFAULT (UUID()) PRIMARY KEY,
    `user_id` VARCHAR(30) NOT NULL,
    `description` VARCHAR(50) DEFAULT NULL,

    INDEX `CHAT_USER_ID_IDX` (`user_id`)
);