package lesson02_principles;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DIP: high-level policy should not depend on low-level details; both depend on abstractions.
 * Before: OrderService news up MySQL and SMTP, so it can't be tested or reconfigured.
 */
public class Dip {

    record Order(String id, String customerEmail, long totalCents) {}

    // ---------- Before ----------
    static class MySqlOrderRepository {
        void save(Order o) { System.out.println("  [mysql] INSERT " + o.id()); }
    }

    static class SmtpEmailSender {
        void send(String to, String body) { System.out.println("  [smtp] to " + to + ": " + body); }
    }

    static class OrderServiceBefore {
        private final MySqlOrderRepository repo = new MySqlOrderRepository();   // hard-wired
        private final SmtpEmailSender email = new SmtpEmailSender();           // hard-wired

        void place(Order o) {
            repo.save(o);
            email.send(o.customerEmail(), "Order " + o.id() + " confirmed");
        }
    }

    // ---------- After ----------
    /** The abstractions are owned by the high-level module and shaped by its needs. */
    interface OrderRepository { void save(Order o); }
    interface Notifier { void notify(String to, String message); }

    static class OrderService {
        private final OrderRepository repo;
        private final Notifier notifier;

        OrderService(OrderRepository repo, Notifier notifier) {   // constructor injection
            this.repo = repo;
            this.notifier = notifier;
        }

        void place(Order o) {
            if (o.totalCents() <= 0) throw new IllegalArgumentException("empty order");
            repo.save(o);
            notifier.notify(o.customerEmail(), "Order " + o.id() + " confirmed");
        }
    }

    // The payoff: fakes for tests, with no database or mail server.
    static class InMemoryOrderRepository implements OrderRepository {
        final Map<String, Order> saved = new HashMap<>();
        public void save(Order o) { saved.put(o.id(), o); }
    }

    static class RecordingNotifier implements Notifier {
        final List<String> sent = new ArrayList<>();
        public void notify(String to, String message) { sent.add(to + " <- " + message); }
    }

    static void demo() {
        new OrderServiceBefore().place(new Order("ORD-7", "a@x.com", 999));

        InMemoryOrderRepository repo = new InMemoryOrderRepository();
        RecordingNotifier notifier = new RecordingNotifier();
        new OrderService(repo, notifier).place(new Order("ORD-8", "b@x.com", 1_999));
        System.out.println("  after, with fakes: saved=" + repo.saved.keySet() + " sent=" + notifier.sent);
    }
}
