package lesson01_playbook.parkinglot;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/** Charges per started hour, with a rate per spot size. */
public class HourlyFeeStrategy implements FeeStrategy {
    private final Map<SpotSize, Long> centsPerHour;

    public HourlyFeeStrategy(Map<SpotSize, Long> centsPerHour) {
        this.centsPerHour = Map.copyOf(centsPerHour);
    }

    @Override
    public long calculateFeeCents(Ticket ticket, Instant exitTime) {
        long minutes = Duration.between(ticket.entryTime(), exitTime).toMinutes();
        long startedHours = Math.max(1, (minutes + 59) / 60);
        Long rate = centsPerHour.get(ticket.spot().getSize());
        if (rate == null) {
            throw new IllegalStateException("No rate configured for " + ticket.spot().getSize());
        }
        return startedHours * rate;
    }
}
