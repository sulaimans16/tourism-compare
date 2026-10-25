package lesson02_principles;

/**
 * ISP: no client should be forced to depend on methods it doesn't use.
 * Before: one fat interface, so cash-on-delivery has to fake or throw on half of it.
 */
public class Isp {

    // ---------- Before ----------
    interface PaymentGatewayBefore {
        void charge(String orderId, long cents);
        void refund(String orderId, long cents);
        void saveCard(String customerId, String cardToken);
        String monthlyReport();
    }

    static class CashOnDeliveryBefore implements PaymentGatewayBefore {
        public void charge(String orderId, long cents) { System.out.println("  collect cash for " + orderId); }
        public void refund(String orderId, long cents) { throw new UnsupportedOperationException(); }
        public void saveCard(String customerId, String cardToken) { throw new UnsupportedOperationException(); }
        public String monthlyReport() { return ""; }   // a lie that compiles
    }

    // ---------- After: role interfaces ----------
    interface Chargeable { void charge(String orderId, long cents); }
    interface Refundable { void refund(String orderId, long cents); }
    interface CardVault { void saveCard(String customerId, String cardToken); }

    static class CashOnDelivery implements Chargeable {
        public void charge(String orderId, long cents) { System.out.println("  COD: collect cash for " + orderId); }
    }

    static class CardGateway implements Chargeable, Refundable, CardVault {
        public void charge(String orderId, long cents) { System.out.println("  card: charge " + orderId); }
        public void refund(String orderId, long cents) { System.out.println("  card: refund " + orderId); }
        public void saveCard(String customerId, String cardToken) { System.out.println("  card: vault token for " + customerId); }
    }

    /** Depends only on what it uses, so any Refundable works and nothing else can be passed. */
    static class RefundService {
        private final Refundable refunds;

        RefundService(Refundable refunds) { this.refunds = refunds; }

        void cancel(String orderId, long cents) { refunds.refund(orderId, cents); }
    }

    static void demo() {
        new CashOnDelivery().charge("ORD-1", 1_200);
        CardGateway card = new CardGateway();
        card.charge("ORD-2", 4_500);
        new RefundService(card).cancel("ORD-2", 4_500);
    }
}
