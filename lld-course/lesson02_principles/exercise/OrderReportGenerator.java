package lesson02_principles.exercise;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * EXERCISE: this class works, but it's a design you'd be marked down for.
 * Refactor it so that:
 *   - the printed output stays exactly the same (diff it before and after)
 *   - adding an XML format, or a new tax region, only means adding a new class
 *   - the report logic can be exercised without touching the file system
 * Then write one sentence per violation you fixed, naming the principle.
 */
public class OrderReportGenerator {

    static class Address {
        String city;
        String region;

        Address(String city, String region) { this.city = city; this.region = region; }
        String getRegion() { return region; }
    }

    static class Customer {
        String email;
        Address address;

        Customer(String email, Address address) { this.email = email; this.address = address; }
        Address getAddress() { return address; }
    }

    static class Order {
        String id;
        Customer customer;
        int quantity;
        long unitPriceCents;

        Customer getCustomer() { return customer; }
    }

    public void generate(String rawData, String format) throws IOException {
        // 1. parse
        List<Order> orders = new ArrayList<>();
        for (String line : rawData.strip().split("\n")) {
            String[] p = line.split(",");
            Order o = new Order();
            o.id = p[0];
            o.customer = new Customer(p[1], new Address(p[2], p[3]));
            o.quantity = Integer.parseInt(p[4]);
            o.unitPriceCents = Long.parseLong(p[5]);
            orders.add(o);
        }

        // 2. compute tax and build output
        StringBuilder out = new StringBuilder();
        if (format.equals("CSV")) {
            out.append("id,email,subtotal,tax,total\n");
        } else if (format.equals("JSON")) {
            out.append("[\n");
        }
        long grandTotal = 0;
        for (int i = 0; i < orders.size(); i++) {
            Order o = orders.get(i);
            long subtotal = o.quantity * o.unitPriceCents;
            long tax;
            switch (o.getCustomer().getAddress().getRegion()) {
                case "IN": tax = subtotal * 18 / 100; break;
                case "US": tax = subtotal * 8 / 100; break;
                case "UK": tax = subtotal * 20 / 100; break;
                default: tax = 0;
            }
            long total = subtotal + tax;
            grandTotal += total;
            if (format.equals("CSV")) {
                out.append(o.id).append(',').append(o.getCustomer().email).append(',')
                   .append(subtotal).append(',').append(tax).append(',').append(total).append('\n');
            } else if (format.equals("JSON")) {
                out.append("  {\"id\": \"").append(o.id).append("\", \"email\": \"").append(o.getCustomer().email)
                   .append("\", \"subtotal\": ").append(subtotal).append(", \"tax\": ").append(tax)
                   .append(", \"total\": ").append(total).append('}')
                   .append(i < orders.size() - 1 ? ",\n" : "\n");
            }
        }
        if (format.equals("JSON")) {
            out.append("]\n");
        }

        // 3. write to disk and log
        new File("out").mkdirs();
        String path = "out/order-report." + format.toLowerCase();
        try (FileWriter w = new FileWriter(path)) {
            w.write(out.toString());
        }
        System.out.print(out);
        System.out.println("-- wrote " + orders.size() + " orders to " + path + ", grand total " + grandTotal);
    }

    public static void main(String[] args) throws IOException {
        String data = """
                ORD-1,alice@example.com,Bengaluru,IN,2,150000
                ORD-2,bob@example.com,Austin,US,1,4999
                ORD-3,carol@example.com,Leeds,UK,3,2500
                ORD-4,dan@example.com,Dubai,AE,1,10000
                """;
        OrderReportGenerator generator = new OrderReportGenerator();
        generator.generate(data, "CSV");
        generator.generate(data, "JSON");
    }
}
