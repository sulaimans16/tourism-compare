package lesson01_playbook.parkinglot;

import java.util.List;
import java.util.Optional;

/** Strategy pattern: how we choose a spot is swappable without touching ParkingLot. */
public interface SpotAllocationStrategy {
    Optional<ParkingSpot> findSpot(List<ParkingFloor> floors, Vehicle vehicle);
}
