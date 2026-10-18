# LLD in Java: from fundamentals to top-tier interviews

One folder per lesson. Each lesson has a lesson page (shared separately) and runnable code here.
Plain Java 21 with no build tool, so nothing distracts from the design.

## Run a lesson

```bash
cd lld-course
javac -d out $(find . -name '*.java')
java -cp out lesson01_playbook.parkinglot.Main
```

`out/` is a build directory. Don't commit it.

## Roadmap (~10 weeks, interview-focused)

| Module | Weeks | Topic |
|---|---|---|
| 0 | 1 | The interview playbook: the 6-step method, scoring rubric, Parking Lot walkthrough |
| 1 | 1 | Principles: SOLID, composition over inheritance, Law of Demeter, UML relationships |
| 2 | 2–3 | Patterns, each tied to a problem: Strategy, Factory, Builder, Singleton, Observer, State, Command, Decorator, Chain of Responsibility, Template Method, Adapter, Facade, Composite |
| 3 | 3–4 | Concurrency for LLD: locks, `ConcurrentHashMap`, atomics, optimistic vs pessimistic locking, producer–consumer |
| 4 | 4–9 | Problem ladder. Warm-up: Parking Lot, Vending Machine, Tic-Tac-Toe, Library. Medium: Elevator, LRU/LFU, Splitwise, BookMyShow, Rate Limiter, Logger. Hard: Message Queue, Order Matching Engine, KV Store with transactions, Ride-sharing, Food Delivery, Job Scheduler, Chess, Text Editor, Rule Engine |
| 5 | 9–10 | Timed mock interviews, scored on the rubric |

## Lessons

- `lesson01_playbook/parkinglot`: Parking Lot built with the 6-step method (Strategy, value objects, injected Clock, coarse locking)
