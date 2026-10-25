package lesson02_principles;

import java.util.List;

/**
 * LSP: anywhere the base type works, every subtype must work too.
 * A subtype may not demand more (stricter preconditions) or promise less (weaker postconditions).
 */
public class Lsp {

    // ---------- Before ----------
    static class AccountBefore {
        protected long balanceCents;

        AccountBefore(long balanceCents) { this.balanceCents = balanceCents; }

        void withdraw(long cents) {
            if (cents > balanceCents) throw new IllegalArgumentException("insufficient funds");
            balanceCents -= cents;
        }
    }

    /** "Is-a account" in English, but it breaks the contract every caller relies on. */
    static class FixedDepositBefore extends AccountBefore {
        FixedDepositBefore(long balanceCents) { super(balanceCents); }

        @Override
        void withdraw(long cents) {
            throw new UnsupportedOperationException("fixed deposit is locked");
        }
    }

    /** Written against the base type. Correct for AccountBefore, broken by FixedDepositBefore. */
    static void payRent(AccountBefore account) {
        account.withdraw(1_000);
    }

    // ---------- After ----------
    /** Only what every account can honestly do. */
    interface Account {
        long balanceCents();
    }

    /** A capability, not a given. Only types that can honour it implement it. */
    interface Withdrawable extends Account {
        void withdraw(long cents);
    }

    static class SavingsAccount implements Withdrawable {
        private long balanceCents;

        SavingsAccount(long balanceCents) { this.balanceCents = balanceCents; }

        public long balanceCents() { return balanceCents; }

        public void withdraw(long cents) {
            if (cents > balanceCents) throw new IllegalArgumentException("insufficient funds");
            balanceCents -= cents;
        }
    }

    static class FixedDeposit implements Account {
        private final long balanceCents;

        FixedDeposit(long balanceCents) { this.balanceCents = balanceCents; }

        public long balanceCents() { return balanceCents; }
    }

    /** Now the compiler refuses to pass a FixedDeposit here. The bug can't be written. */
    static void payRent(Withdrawable account) {
        account.withdraw(1_000);
    }

    static void demo() {
        try {
            payRent(new FixedDepositBefore(50_000));
        } catch (UnsupportedOperationException e) {
            System.out.println("  before: payRent blew up at runtime -> " + e.getMessage());
        }
        SavingsAccount savings = new SavingsAccount(50_000);
        payRent(savings);
        System.out.println("  after: savings balance " + savings.balanceCents()
                + "; FixedDeposit can't even be passed to payRent");

        try {
            List.of("a", "b").add("c");
        } catch (UnsupportedOperationException e) {
            System.out.println("  JDK's own LSP compromise: List.of(...).add() -> UnsupportedOperationException");
        }
    }
}
