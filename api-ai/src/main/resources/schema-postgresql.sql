CREATE TABLE IF NOT EXISTS SPRING_AI_CHAT_MEMORY (
                                                     conversation_id VARCHAR(36) NOT NULL,
                                                     content TEXT NOT NULL,
                                                     type VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
                                                     "timestamp" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS SPRING_AI_CHAT_MEMORY_CONVERSATION_ID_TIMESTAMP_IDX
    ON SPRING_AI_CHAT_MEMORY(conversation_id, "timestamp");


CREATE TABLE IF NOT EXISTS CHAT_MEMORY (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL,
    description VARCHAR(35) NOT NULL
);