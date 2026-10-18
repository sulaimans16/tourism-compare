package lesson01_playbook.parkinglot;

public class Truck extends Vehicle {
    public Truck(String licensePlate) {
        super(licensePlate);
    }

    @Override
    public SpotSize requiredSpotSize() {
        return SpotSize.LARGE;
    }
}
