package lesson01_playbook.parkinglot;

/** A spot owns its own occupancy state; nobody else flips it directly. */
public class ParkingSpot {
    private final String id;
    private final SpotSize size;
    private Vehicle parkedVehicle;

    public ParkingSpot(String id, SpotSize size) {
        this.id = id;
        this.size = size;
    }

    public boolean isFree() {
        return parkedVehicle == null;
    }

    public boolean canFit(Vehicle vehicle) {
        return isFree() && size.canHold(vehicle.requiredSpotSize());
    }

    public void park(Vehicle vehicle) {
        if (!canFit(vehicle)) {
            throw new IllegalStateException("Spot " + id + " cannot take " + vehicle);
        }
        this.parkedVehicle = vehicle;
    }

    public void vacate() {
        this.parkedVehicle = null;
    }

    public String getId() {
        return id;
    }

    public SpotSize getSize() {
        return size;
    }
}
