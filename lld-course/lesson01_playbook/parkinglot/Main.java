package lesson01_playbook.parkinglot;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        ManualClock clock = new ManualClock(Instant.parse("2026-10-18T09:00:00Z"));

        List<ParkingFloor> floors = List.of(
                new ParkingFloor(0, List.of(
                        new ParkingSpot("F0-S1", SpotSize.SMALL),
                        new ParkingSpot("F0-M1", SpotSize.MEDIUM))),
                new ParkingFloor(1, List.of(
                        new ParkingSpot("F1-M1", SpotSize.MEDIUM),
                        new ParkingSpot("F1-L1", SpotSize.LARGE))));

        FeeStrategy fees = new HourlyFeeStrategy(Map.of(
                SpotSize.SMALL, 100L,
                SpotSize.MEDIUM, 250L,
                SpotSize.LARGE, 500L));

        ParkingLot lot = new ParkingLot(floors, new NearestSpotStrategy(), fees, clock);

        Ticket bike = lot.park(new Bike("KA-01-B-1"));
        Ticket car1 = lot.park(new Car("KA-01-C-1"));
        Ticket car2 = lot.park(new Car("KA-01-C-2"));
        Ticket truck = lot.park(new Truck("KA-01-T-1"));
        for (Ticket t : List.of(bike, car1, car2, truck)) {
            System.out.println("Parked " + t.vehicle() + " at " + t.spot().getId());
        }

        try {
            lot.park(new Car("KA-01-C-3"));
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }

        clock.advance(Duration.ofMinutes(130));
        System.out.printf("Car %s paid $%.2f after 2h10m%n",
                car1.vehicle().getLicensePlate(), lot.unpark(car1.id()) / 100.0);

        Ticket car3 = lot.park(new Car("KA-01-C-3"));
        System.out.println("Parked " + car3.vehicle() + " at " + car3.spot().getId());
    }

    /** A clock we control, so time-based logic is testable. Inject time; don't call Instant.now(). */
    static final class ManualClock extends Clock {
        private Instant now;

        ManualClock(Instant start) {
            this.now = start;
        }

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
