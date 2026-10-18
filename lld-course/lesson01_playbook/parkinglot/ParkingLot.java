package lesson01_playbook.parkinglot;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Facade over the whole system. It coordinates, but delegates the decisions
 * (which spot, how much to charge) to injected strategies.
 */
public class ParkingLot {
    private final List<ParkingFloor> floors;
    private final SpotAllocationStrategy allocationStrategy;
    private final FeeStrategy feeStrategy;
    private final Clock clock;
    private final Map<String, Ticket> activeTickets = new HashMap<>();

    public ParkingLot(List<ParkingFloor> floors,
                      SpotAllocationStrategy allocationStrategy,
                      FeeStrategy feeStrategy,
                      Clock clock) {
        this.floors = List.copyOf(floors);
        this.allocationStrategy = allocationStrategy;
        this.feeStrategy = feeStrategy;
        this.clock = clock;
    }

    /**
     * Coarse lock for now: find-then-park must be atomic, or two cars can get the same spot.
     * Module 3 replaces this with finer-grained locking.
     */
    public synchronized Ticket park(Vehicle vehicle) {
        ParkingSpot spot = allocationStrategy.findSpot(floors, vehicle)
                .orElseThrow(() -> new IllegalStateException("No free spot for " + vehicle));
        spot.park(vehicle);
        Ticket ticket = new Ticket(UUID.randomUUID().toString(), vehicle, spot, clock.instant());
        activeTickets.put(ticket.id(), ticket);
        return ticket;
    }

    /** Returns the fee in cents and frees the spot. */
    public synchronized long unpark(String ticketId) {
        Ticket ticket = activeTickets.remove(ticketId);
        if (ticket == null) {
            throw new IllegalArgumentException("Unknown or already used ticket: " + ticketId);
        }
        Instant exitTime = clock.instant();
        long fee = feeStrategy.calculateFeeCents(ticket, exitTime);
        ticket.spot().vacate();
        return fee;
    }
}
