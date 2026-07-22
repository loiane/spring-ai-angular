INSERT INTO flight_reservations (reservation_id, flight_number, passenger_first_name, passenger_last_name, passenger_email, departure_airport, arrival_airport, seat_number, flight_class, status, created_at, updated_at)
SELECT 'SF-1001', 'SF101', 'Alice', 'Turner', 'alice.turner@example.com', 'GRU', 'JFK', '14A', 'BUSINESS', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM flight_reservations WHERE reservation_id = 'SF-1001');

INSERT INTO flight_reservations (reservation_id, flight_number, passenger_first_name, passenger_last_name, passenger_email, departure_airport, arrival_airport, seat_number, flight_class, status, created_at, updated_at)
SELECT 'SF-1002', 'SF202', 'Benjamin', 'Clarke', 'benjamin.clarke@example.com', 'JFK', 'LHR', '22C', 'ECONOMY', 'CHECKED_IN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM flight_reservations WHERE reservation_id = 'SF-1002');

INSERT INTO flight_reservations (reservation_id, flight_number, passenger_first_name, passenger_last_name, passenger_email, departure_airport, arrival_airport, seat_number, flight_class, status, created_at, updated_at)
SELECT 'SF-1003', 'SF303', 'Charlotte', 'Bennett', 'charlotte.bennett@example.com', 'LHR', 'CDG', '7F', 'PREMIUM_ECONOMY', 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM flight_reservations WHERE reservation_id = 'SF-1003');

INSERT INTO flight_reservations (reservation_id, flight_number, passenger_first_name, passenger_last_name, passenger_email, departure_airport, arrival_airport, seat_number, flight_class, status, created_at, updated_at)
SELECT 'SF-1004', 'SF404', 'Daniel', 'Whitfield', 'daniel.whitfield@example.com', 'CDG', 'GRU', '9B', 'ECONOMY', 'CANCELLED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM flight_reservations WHERE reservation_id = 'SF-1004');

INSERT INTO flight_reservations (reservation_id, flight_number, passenger_first_name, passenger_last_name, passenger_email, departure_airport, arrival_airport, seat_number, flight_class, status, created_at, updated_at)
SELECT 'SF-1005', 'SF505', 'Eleanor', 'Hayes', 'eleanor.hayes@example.com', 'GRU', 'MIA', '3A', 'BUSINESS', 'CONFIRMED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM flight_reservations WHERE reservation_id = 'SF-1005');
