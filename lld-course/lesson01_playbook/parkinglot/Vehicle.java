package lesson01_playbook.parkinglot;

/**
 * Each vehicle declares the spot size it needs. Adding a vehicle type means adding
 * a subclass, not editing a switch somewhere (Open/Closed Principle).
 */
public abstract class Vehicle {
    private final String licensePlate;

    protected Vehicle(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public abstract SpotSize requiredSpotSize();

    @Override
    public String toString() {
        return getClass().getSimpleName() + "(" + licensePlate + ")";
    }
}
