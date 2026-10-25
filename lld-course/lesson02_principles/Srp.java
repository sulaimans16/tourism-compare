package lesson02_principles;

import java.util.ArrayList;
import java.util.List;

/**
 * SRP: a class should have one reason to change, i.e. answer to one actor.
 * Before: finance (totals), UI (formatting) and the DBA (storage) all edit the same class.
 */
public class Srp {

    record LineItem(String name, int quantity, long unitPriceCents) {
        long totalCents() {
            return quantity * unitPriceCents;
        }
    }

    // ---------- Before ----------
    static class InvoiceBefore {
        final List<LineItem> items = new ArrayList<>();

        long totalCents() {                       // finance's rule
            return items.stream().mapToLong(LineItem::totalCents).sum();
        }

        String print() {                          // UI's rule
            StringBuilder sb = new StringBuilder("INVOICE\n");
            items.forEach(i -> sb.append(String.format("  %-8s x%d%n", i.name(), i.quantity())));
            return sb.append(String.format("  TOTAL $%.2f", totalCents() / 100.0)).toString();
        }

        void saveToDatabase() {                   // DBA's rule
            System.out.println("    INSERT INTO invoices ... (" + totalCents() + ")");
        }
    }

    // ---------- After ----------
    /** Pure business object: owns data and the rules finance cares about. */
    static class Invoice {
        private final List<LineItem> items;

        Invoice(List<LineItem> items) {
            this.items = List.copyOf(items);
        }

        List<LineItem> items() {
            return items;
        }

        long totalCents() {
            return items.stream().mapToLong(LineItem::totalCents).sum();
        }
    }

    static class InvoicePrinter {
        String print(Invoice invoice) {
            StringBuilder sb = new StringBuilder("INVOICE\n");
            invoice.items().forEach(i -> sb.append(String.format("  %-8s x%d%n", i.name(), i.quantity())));
            return sb.append(String.format("  TOTAL $%.2f", invoice.totalCents() / 100.0)).toString();
        }
    }

    interface InvoiceRepository {
        void save(Invoice invoice);
    }

    static class SqlInvoiceRepository implements InvoiceRepository {
        @Override
        public void save(Invoice invoice) {
            System.out.println("    INSERT INTO invoices ... (" + invoice.totalCents() + ")");
        }
    }

    static void demo() {
        Invoice invoice = new Invoice(List.of(
                new LineItem("Coffee", 2, 350),
                new LineItem("Bagel", 1, 275)));
        System.out.println(new InvoicePrinter().print(invoice));
        new SqlInvoiceRepository().save(invoice);
    }
}
