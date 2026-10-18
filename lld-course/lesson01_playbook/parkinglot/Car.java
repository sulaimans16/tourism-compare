package lesson01_playbook.parkinglot;

public class Car extends Vehicle {
    public Car(String licensePlate) {
        super(licensePlate);
    }

    @Override
    public SpotSize requiredSpotSize() {
        return SpotSize.MEDIUM;
    }
}
