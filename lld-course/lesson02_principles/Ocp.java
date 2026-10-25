package lesson02_principles;

/**
 * OCP: open for extension, closed for modification.
 * Before: every new customer tier means editing (and re-testing) the switch.
 */
public class Ocp {

    // ---------- Before ----------
    enum CustomerType { REGULAR, GOLD, EMPLOYEE }

    static long discountedPriceBefore(CustomerType type, long priceCents) {
        return switch (type) {
            case REGULAR -> priceCents;
            case GOLD -> priceCents * 90 / 100;
            case EMPLOYEE -> priceCents * 70 / 100;
            // adding PLATINUM: edit here, and in every other switch on CustomerType
        };
    }

    // ---------- After ----------
    interface DiscountPolicy {
        long apply(long priceCents);
    }

    static class NoDiscount implements DiscountPolicy {
        public long apply(long priceCents) { return priceCents; }
    }

    static class PercentOff implements DiscountPolicy {
        private final int percent;

        PercentOff(int percent) {
            if (percent < 0 || percent > 100) throw new IllegalArgumentException("percent: " + percent);
            this.percent = percent;
        }

        public long apply(long priceCents) { return priceCents * (100 - percent) / 100; }
    }

    /** A brand-new rule, added without touching any existing class. */
    static class FlatOffAboveThreshold implements DiscountPolicy {
        private final long thresholdCents, offCents;

        FlatOffAboveThreshold(long thresholdCents, long offCents) {
            this.thresholdCents = thresholdCents;
            this.offCents = offCents;
        }

        public long apply(long priceCents) {
            return priceCents >= thresholdCents ? priceCents - offCents : priceCents;
        }
    }

    static void demo() {
        long price = 10_000;
        System.out.println("  before, GOLD:        " + discountedPriceBefore(CustomerType.GOLD, price));
        System.out.println("  after, PercentOff10: " + new PercentOff(10).apply(price));
        System.out.println("  after, NoDiscount:   " + new NoDiscount().apply(price));
        System.out.println("  after, $15 off $80+: " + new FlatOffAboveThreshold(8_000, 1_500).apply(price));
    }
}
