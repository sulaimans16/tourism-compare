package lesson01_playbook.parkinglot;

import java.time.Instant;

/** Immutable value object: once issued, a ticket never changes. */
public record Ticket(String id, Vehicle vehicle, ParkingSpot spot, Instant entryTime) {
}
