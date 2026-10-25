package lesson02_principles;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Inheritance couples you to the parent's implementation details, not just its API.
 * This is the classic bug from Effective Java (Item 18).
 */
public class CompositionOverInheritance {

    // ---------- Before ----------
    static class InstrumentedHashSet<E> extends HashSet<E> {
        private int addCount = 0;

        @Override
        public boolean add(E e) {
            addCount++;
            return super.add(e);
        }

        @Override
        public boolean addAll(Collection<? extends E> c) {
            addCount += c.size();
            return super.addAll(c);   // HashSet.addAll calls add() per element, so each one is counted twice
        }

        int getAddCount() { return addCount; }
    }

    // ---------- After: wrap, don't extend ----------
    static class InstrumentedSet<E> {
        private final Set<E> delegate;
        private int addCount = 0;

        InstrumentedSet(Set<E> delegate) { this.delegate = delegate; }

        public boolean add(E e) {
            addCount++;
            return delegate.add(e);
        }

        public boolean addAll(Collection<? extends E> c) {
            addCount += c.size();
            return delegate.addAll(c);   // whatever delegate does internally can't reach our add()
        }

        int getAddCount() { return addCount; }
    }

    static void demo() {
        InstrumentedHashSet<String> inherited = new InstrumentedHashSet<>();
        inherited.addAll(List.of("a", "b", "c"));
        System.out.println("  extends HashSet:  addCount = " + inherited.getAddCount() + "   <-- expected 3");

        InstrumentedSet<String> composed = new InstrumentedSet<>(new HashSet<>());
        composed.addAll(List.of("a", "b", "c"));
        System.out.println("  wraps a Set:      addCount = " + composed.getAddCount());
    }
}
