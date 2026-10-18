package lesson01_playbook.parkinglot;

import java.util.List;

/** Composition: a floor owns its spots; the spots do not exist without it. */
public class ParkingFloor {
    private final int number;
    private final List<ParkingSpot> spots;

    public ParkingFloor(int number, List<ParkingSpot> spots) {
        this.number = number;
        this.spots = List.copyOf(spots);
    }

    public int getNumber() {
        return number;
    }

    public List<ParkingSpot> getSpots() {
        return spots;
    }
}
