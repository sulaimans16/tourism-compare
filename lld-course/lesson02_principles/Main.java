package lesson02_principles;

public class Main {
    public static void main(String[] args) {
        section("SRP: Invoice split by actor", Srp::demo);
        section("OCP: discounts as policies", Ocp::demo);
        section("LSP: FixedDeposit is not a withdrawable account", Lsp::demo);
        section("ISP: role interfaces for payments", Isp::demo);
        section("DIP: inject what you depend on", Dip::demo);
        section("Composition over inheritance: InstrumentedHashSet", CompositionOverInheritance::demo);
        section("Law of Demeter: tell, don't ask", LawOfDemeter::demo);
    }

    private static void section(String title, Runnable demo) {
        System.out.println("\n== " + title + " ==");
        demo.run();
    }
}
