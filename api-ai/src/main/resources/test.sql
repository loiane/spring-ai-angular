select * from chat_memory;

select * from spring_ai_chat_memory;

-- Sample flight reservations data for testing
INSERT INTO flight_reservations (
    reservation_id, flight_number, passenger_first_name, passenger_last_name, 
    passenger_email, departure_airport, arrival_airport, seat_number, 
    flight_class, status, created_at, updated_at
) VALUES 
('FR-12345678', 'AA101', 'John', 'Doe', 'john.doe@email.com', 'JFK', 'LAX', '12A', 'ECONOMY', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FR-87654321', 'UA205', 'Jane', 'Smith', 'jane.smith@email.com', 'ORD', 'SFO', '8F', 'BUSINESS', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FR-11223344', 'DL450', 'Alice', 'Johnson', 'alice.johnson@email.com', 'ATL', 'BOS', '15C', 'PREMIUM_ECONOMY', 'CHECKED_IN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('FR-55667788', 'SW123', 'Bob', 'Wilson', 'bob.wilson@email.com', 'LAS', 'DEN', '22D', 'ECONOMY', 'CANCELLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test query to view all reservations
select * from flight_reservations order by created_at desc;