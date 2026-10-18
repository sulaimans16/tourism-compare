package lesson01_playbook.parkinglot;

import java.time.Instant;

/** Money is in cents (long). Never use double for money. */
public interface FeeStrategy {
    long calculateFeeCents(Ticket ticket, Instant exitTime);
}
