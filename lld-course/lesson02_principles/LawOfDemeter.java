package lesson02_principles;

/**
 * Law of Demeter: talk to your friends, not to strangers. "Tell, don't ask."
 * Before: checkout reaches through Customer into Wallet and does the wallet's job for it.
 */
public class LawOfDemeter {

    static class Wallet {
        private long balanceCents;

        Wallet(long balanceCents) { this.balanceCents = balanceCents; }

        long getBalanceCents() { return balanceCents; }
        void setBalanceCents(long v) { balanceCents = v; }

        /** After: the wallet guards its own invariant. */
        void debit(long cents) {
            if (cents > balanceCents) throw new IllegalStateException("insufficient balance");
            balanceCents -= cents;
        }
    }

    static class Customer {
        private final Wallet wallet;

        Customer(Wallet wallet) { this.wallet = wallet; }

        Wallet getWallet() { return wallet; }       // the leak that makes "before" possible

        /** After: customer decides how it pays. Could become card, points, split... */
        void pay(long cents) { wallet.debit(cents); }
    }

    // ---------- Before ----------
    static void checkoutBefore(Customer customer, long cents) {
        Wallet w = customer.getWallet();
        if (w.getBalanceCents() < cents) throw new IllegalStateException("insufficient balance");
        w.setBalanceCents(w.getBalanceCents() - cents);   // business rule lives in the wrong class
    }

    // ---------- After ----------
    static void checkout(Customer customer, long cents) {
        customer.pay(cents);
    }

    static void demo() {
        Customer c = new Customer(new Wallet(5_000));
        checkoutBefore(c, 1_000);
        checkout(c, 1_000);
        System.out.println("  balance after two checkouts: " + c.getWallet().getBalanceCents());
    }
}
