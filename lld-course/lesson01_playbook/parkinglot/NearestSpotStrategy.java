package lesson01_playbook.parkinglot;

import java.util.List;
import java.util.Optional;

/** Lowest floor first, then the first spot on that floor that fits. */
public class NearestSpotStrategy implements SpotAllocationStrategy {
    @Override
    public Optional<ParkingSpot> findSpot(List<ParkingFloor> floors, Vehicle vehicle) {
        return floors.stream()
                .flatMap(floor -> floor.getSpots().stream())
                .filter(spot -> spot.canFit(vehicle))
                .findFirst();
    }
}
