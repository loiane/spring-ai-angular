package com.loiane.api_ai.flightreservation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing flight reservations using JDBC.
 * Follows the existing pattern established in ChatMemoryIDRepository.
 */
@Repository
public class FlightReservationRepository {

    private static final Logger logger = LoggerFactory.getLogger(FlightReservationRepository.class);

    private final JdbcTemplate jdbcTemplate;

    public FlightReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Retrieve all flight reservations
     */
    public List<FlightReservation> findAll() {
        logger.debug("Finding all flight reservations");
        String sql = """
            SELECT reservation_id, flight_number, passenger_first_name, passenger_last_name, 
                   passenger_email, departure_airport, arrival_airport, seat_number, 
                   flight_class, status, created_at, updated_at 
            FROM flight_reservations 
            ORDER BY created_at DESC
            """;
        return jdbcTemplate.query(sql, new FlightReservationRowMapper());
    }

    /**
     * Find a flight reservation by its ID
     */
    public Optional<FlightReservation> findById(String reservationId) {
        logger.debug("Finding flight reservation with ID: {}", reservationId);
        String sql = """
            SELECT reservation_id, flight_number, passenger_first_name, passenger_last_name, 
                   passenger_email, departure_airport, arrival_airport, seat_number, 
                   flight_class, status, created_at, updated_at 
            FROM flight_reservations 
            WHERE reservation_id = ?
            """;
        
        List<FlightReservation> reservations = jdbcTemplate.query(sql, new FlightReservationRowMapper(), reservationId);
        return reservations.isEmpty() ? Optional.empty() : Optional.of(reservations.get(0));
    }

    /**
     * Save a new flight reservation
     */
    public FlightReservation save(FlightReservation reservation) {
        logger.debug("Saving flight reservation: {}", reservation.reservationId());
        
        String reservationId = reservation.reservationId() != null ? 
            reservation.reservationId() : generateReservationId();
        
        LocalDateTime now = LocalDateTime.now();
        
        String sql = """
            INSERT INTO flight_reservations 
            (reservation_id, flight_number, passenger_first_name, passenger_last_name, 
             passenger_email, departure_airport, arrival_airport, seat_number, 
             flight_class, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

        jdbcTemplate.update(sql,
            reservationId,
            reservation.flightNumber(),
            reservation.passengerFirstName(),
            reservation.passengerLastName(),
            reservation.passengerEmail(),
            reservation.departureAirport(),
            reservation.arrivalAirport(),
            reservation.seatNumber(),
            reservation.flightClass().name(),
            reservation.status().name(),
            now,
            now
        );

        return new FlightReservation(
            reservationId,
            reservation.flightNumber(),
            reservation.passengerFirstName(),
            reservation.passengerLastName(),
            reservation.passengerEmail(),
            reservation.departureAirport(),
            reservation.arrivalAirport(),
            reservation.seatNumber(),
            reservation.flightClass(),
            reservation.status(),
            now,
            now
        );
    }

    /**
     * Update the status of a flight reservation
     */
    public boolean updateStatus(String reservationId, ReservationStatus status) {
        logger.debug("Updating reservation {} status to {}", reservationId, status);
        String sql = """
            UPDATE flight_reservations 
            SET status = ?, updated_at = ? 
            WHERE reservation_id = ?
            """;
        
        int rowsAffected = jdbcTemplate.update(sql, status.name(), LocalDateTime.now(), reservationId);
        return rowsAffected > 0;
    }

    /**
     * Check if a reservation ID exists
     */
    public boolean existsById(String reservationId) {
        logger.debug("Checking if reservation exists: {}", reservationId);
        String sql = "SELECT COUNT(*) FROM flight_reservations WHERE reservation_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, reservationId);
        return count != null && count > 0;
    }

    /**
     * Find reservations by passenger email
     */
    public List<FlightReservation> findByPassengerEmail(String email) {
        logger.debug("Finding reservations for passenger email: {}", email);
        String sql = """
            SELECT reservation_id, flight_number, passenger_first_name, passenger_last_name, 
                   passenger_email, departure_airport, arrival_airport, seat_number, 
                   flight_class, status, created_at, updated_at 
            FROM flight_reservations 
            WHERE passenger_email = ?
            ORDER BY created_at DESC
            """;
        return jdbcTemplate.query(sql, new FlightReservationRowMapper(), email);
    }

    /**
     * Generate a unique reservation ID
     */
    private String generateReservationId() {
        return "FR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * Row mapper for FlightReservation records
     */
    private static class FlightReservationRowMapper implements RowMapper<FlightReservation> {
        @Override
        public FlightReservation mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new FlightReservation(
                rs.getString("reservation_id"),
                rs.getString("flight_number"),
                rs.getString("passenger_first_name"),
                rs.getString("passenger_last_name"),
                rs.getString("passenger_email"),
                rs.getString("departure_airport"),
                rs.getString("arrival_airport"),
                rs.getString("seat_number"),
                FlightClass.valueOf(rs.getString("flight_class")),
                ReservationStatus.valueOf(rs.getString("status")),
                rs.getTimestamp("created_at").toLocalDateTime(),
                rs.getTimestamp("updated_at").toLocalDateTime()
            );
        }
    }
}
