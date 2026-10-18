package lesson01_playbook.parkinglot;

/** Ordered smallest to largest, so "fits" is a simple ordinal comparison. */
public enum SpotSize {
    SMALL, MEDIUM, LARGE;

    public boolean canHold(SpotSize required) {
        return this.ordinal() >= required.ordinal();
    }
}
