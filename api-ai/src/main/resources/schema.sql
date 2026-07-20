CREATE TABLE IF NOT EXISTS CHAT_MEMORY (
    conversation_id UUID DEFAULT RANDOM_UUID() PRIMARY KEY,
    user_id VARCHAR(256),
    description VARCHAR(256)
);

-- Spring AI 2.0 JDBC chat memory schema (requires sequence_id for message ordering)
-- Note: timestamp is unquoted to match Spring AI's H2ChatMemoryRepositoryDialect,
-- which generates unquoted `timestamp` in its queries. H2 quoted identifiers are
-- case-sensitive/exact-match, so a quoted "timestamp" column would not be found
-- by Spring AI's unquoted queries.
CREATE TABLE IF NOT EXISTS spring_ai_chat_memory (
    conversation_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
    timestamp TIMESTAMP NOT NULL,
    sequence_id BIGINT NOT NULL
);

-- Migrate tables created by Spring AI 1.x (before the sequence_id column existed)
ALTER TABLE spring_ai_chat_memory ADD COLUMN IF NOT EXISTS sequence_id BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS spring_ai_chat_memory_conversation_id_timestamp_idx
    ON spring_ai_chat_memory(conversation_id, timestamp);

CREATE INDEX IF NOT EXISTS spring_ai_chat_memory_conversation_id_sequence_id_idx
    ON spring_ai_chat_memory(conversation_id, sequence_id);

CREATE TABLE IF NOT EXISTS flight_reservations (
    reservation_id VARCHAR(255) PRIMARY KEY,
    flight_number VARCHAR(20) NOT NULL,
    passenger_first_name VARCHAR(255) NOT NULL,
    passenger_last_name VARCHAR(255) NOT NULL,
    passenger_email VARCHAR(255) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    arrival_airport VARCHAR(10) NOT NULL,
    seat_number VARCHAR(10),
    flight_class VARCHAR(50) NOT NULL DEFAULT 'ECONOMY',
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
