package lesson01_playbook.parkinglot;

public class Bike extends Vehicle {
    public Bike(String licensePlate) {
        super(licensePlate);
    }

    @Override
    public SpotSize requiredSpotSize() {
        return SpotSize.SMALL;
    }
}
