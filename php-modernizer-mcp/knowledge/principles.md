# OOP Design Principles & Patterns (the target shapes)

When the expert proposes an OOP design it justifies it against these. Prefer the
*smallest* design that removes real duplication/coupling — do not over-engineer.

## SOLID (Robert C. Martin)

- **SRP** — one reason to change per class. Split "god" procedural files by
  concern (validation, persistence, rendering, orchestration).
- **OCP** — extend via new classes/polymorphism, not by editing big `switch`
  statements. Smell: `switch ($type)` repeated across the codebase → Strategy/Factory.
- **LSP** — subclasses must be substitutable; no surprise exceptions or
  weakened post-conditions.
- **ISP** — many small role interfaces beat one fat interface.
- **DIP** — high-level policy depends on abstractions; inject concretes. This is
  the principle that kills `global`, `new` buried in logic, and static calls.

## Other principles the expert applies

- **Composition over inheritance.** Reach for inheritance only for true is-a +
  LSP; otherwise compose collaborators.
- **Tell, Don't Ask / encapsulation.** Behavior lives with the data it acts on;
  no anemic data bags manipulated by procedural functions elsewhere.
- **Law of Demeter.** Don't reach through object graphs.
- **DRY / Once and Only Once.** But only after you see real duplication
  (Rule of Three) — premature abstraction is its own smell.
- **YAGNI / KISS.** Modernize what hurts; don't gold-plate.
- **Value Objects & immutability.** Replace primitive-obsessed parameter lists
  (e.g. `($email, $name)`) with typed value objects; use `readonly`.

## Procedural smell → OOP move (quick map)

| Procedural smell                         | OOP move                                   |
|------------------------------------------|--------------------------------------------|
| `global $db;`                            | Inject the dependency (constructor)        |
| `new Mailer()` mid-function              | Inject behind interface (DIP)              |
| `switch ($type) { ... }` everywhere      | Strategy + Factory / polymorphism          |
| Long param lists / primitive obsession   | Value Object / parameter object            |
| Functions sharing `$_SESSION`/globals    | Class with private state; inject session   |
| `date()` / `time()` in logic             | PSR-20 Clock injected                       |
| `echo`/HTML inside logic                 | Responder/Template (presentation layer)    |
| `mysqli_*` / inline SQL scattered        | Repository / Table-Data-Gateway            |
| Boolean/flag args changing behavior      | Separate methods or Strategy               |
| Copy-pasted variant blocks               | Template Method / Decorator                |
| Returning error codes / mixed returns    | Exceptions + typed returns                 |
| Singletons / static service locators     | DI container (PSR-11) + injection          |

## Patterns most used in PHP modernization (GoF + enterprise)

- **Repository / Table Data Gateway / Data Mapper** — isolate persistence.
- **Strategy** — interchangeable algorithms; kills `switch`-on-type.
- **Factory / Abstract Factory** — centralize construction.
- **Adapter** — wrap legacy/3rd-party APIs behind your interface.
- **Decorator** — layer cross-cutting behavior (logging, caching).
- **Null Object** — remove `if ($x === null)` checks.
- **Value Object** — typed, validated, immutable domain primitives.
- **Front Controller + ADR/MVC** — HTTP request handling.
- **Observer / PSR-14 events** — decouple side effects.
