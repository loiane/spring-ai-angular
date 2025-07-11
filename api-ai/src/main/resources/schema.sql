DROP TABLE IF EXISTS CHAT_MEMORY;
DROP TABLE IF EXISTS spring_ai_chat_memory;

CREATE TABLE IF NOT EXISTS CHAT_MEMORY (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(256),
    description VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS spring_ai_chat_memory (
    id SERIAL PRIMARY KEY,
    conversation_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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