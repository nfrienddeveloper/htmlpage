# Refactoring & Dependency-Breaking Catalog (Fowler + Feathers)

Named, behavior-preserving moves. The expert always cites the move it is making.
Every move must keep tests green; design-changing behavior is a separate commit.

## Feathers — getting legacy code under test

- **Characterization Test** — write a test that documents *current* behavior
  (even buggy), so you can refactor safely. Start at the coarsest seam available.
- **Seam** — a place where behavior can be altered without editing in place
  (object seam = inject a different collaborator; the goal of most early moves).
- **Sprout Method / Sprout Class** — add new behavior in a fresh, tested unit
  rather than editing a tangled function.
- **Wrap Method / Wrap Class** — wrap existing behavior to add to it without
  changing the original body.
- **Parameterize Constructor / Method** — turn a hard-coded `new`/global into an
  injected parameter (the workhorse of de-globalizing PHP).
- **Extract Interface** — introduce an interface over a concrete so callers
  depend on the abstraction (enables test doubles + DIP).
- **Break Out Method Object** — turn a giant function into a class whose fields
  are the former locals; then extract methods freely.

## Fowler — composing/moving (the common PHP sequence)

1. **Extract Function/Method** — name a coherent block.
2. **Slide Statements / Split Variable** — tidy locals before extracting.
3. **Extract Class** — group related fields+methods out of a god file.
4. **Move Function/Field** — relocate to the class that owns the data.
5. **Replace Temp with Query**, **Inline Variable** — clarify dataflow.
6. **Introduce Parameter Object / Preserve Whole Object** — shrink param lists.
7. **Replace Constructor with Factory Function** — control construction.
8. **Replace Conditional with Polymorphism** — kill `switch ($type)`.
9. **Replace Error Code with Exception**, **Replace Magic Literal with Constant/Enum**.
10. **Encapsulate Variable / Record** — wrap globals and arrays in objects.
11. **Combine Functions into Class** — the canonical procedural→OOP step:
    functions that share data become a class with that data as state.

## The default procedural-function → class recipe

Given a set of free functions in an include file that pass the same data around:

1. Add a characterization test exercising those functions.
2. `Combine Functions into Class`: create a class; make the shared data
   constructor parameters/fields.
3. `Move Function`: move each function in as a method, `$param` → `$this->`.
4. `Parameterize Constructor`: replace any global/`new`/static dependency with an
   injected collaborator (Extract Interface first if you need a test double).
5. Add types + `declare(strict_types=1)`; apply PSR-12.
6. Update call sites (or add a thin procedural shim that delegates, for Strangler
   migration) and keep tests green.
7. Commit. One class per commit.

## Strangler Fig (large systems)

Stand up the new OOP component beside the legacy path; route a slice of traffic/
features to it; verify parity with tests; expand the slice; delete the strangled
legacy code. Repeat until the legacy path is empty. Never a single flag-day swap.
