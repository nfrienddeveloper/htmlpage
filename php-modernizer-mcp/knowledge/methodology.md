# The Canonical Methodology for Procedural-PHP → OOP

> This file is the spine of the expert. Tools read it to produce plans, conversions,
> and reviews. Edit it to "train" the expert's process. Keep it ordered and concrete.

## Primary authority

The single most respected, purpose-built authority on *this exact task* is:

- **Paul M. Jones — _Modernizing Legacy Applications in PHP_** (Leanpub).
  A step-by-step, refactor-as-you-go playbook that takes a `require`-spaghetti,
  global-state, mixed-concern codebase to autoloaded, dependency-injected,
  layered, testable OOP **without a rewrite and without ever leaving a
  working state**. The ordered phases below follow his method.

Supporting authorities (general, but foundational and universally respected):

- **Michael C. Feathers — _Working Effectively with Legacy Code_** — seams,
  characterization tests, and dependency-breaking techniques. The rule:
  *"Legacy code is simply code without tests."* Get a seam, pin behavior with a
  test, then change.
- **Martin Fowler — _Refactoring: Improving the Design of Existing Code_ (2nd ed.)**
  — the catalog of named, behavior-preserving transformations. Also the source of
  the **Strangler Fig** migration pattern.
- **Robert C. Martin — _Clean Code_ / _Clean Architecture_** — SOLID and
  dependency-direction discipline for the target design.
- **Eric Evans / Vaughn Vernon — Domain-Driven Design** — for naming and
  structuring the domain model you extract into.
- **Gang of Four — _Design Patterns_** — the shared vocabulary for the OOP shapes.
- **PHP-FIG / PSR standards** (see `psr.md`) — the interoperability law of modern PHP.
- **PHP The Right Way** (phptherightway.com) and **Composer** — community baseline.

> Rule of thumb the expert must enforce: *never modernize without a safety net,
> never big-bang rewrite, always keep the app runnable after every commit.*

## Phase 0 — Establish a safety net (do this first, always)

1. Put everything under version control; create a modernization branch.
2. Make the app reproducibly runnable (document/automate setup).
3. Add **characterization tests** at the highest available seam (HTTP/CLI
   end-to-end is fine to start). Pin current behavior, including current bugs.
4. Add static-analysis and style baselines so you can measure progress:
   - PHPStan or Psalm at a low level with a baseline file.
   - PHP-CS-Fixer / PHP_CodeSniffer (PSR-12).
5. Adopt Composer; add `vendor/autoload.php` even if nothing uses it yet.

## Phase 1 — Tame includes and entry points

6. Establish a **single point of entry** (front controller, `public/index.php`).
7. Replace scattered `include`/`require` of logic with **class autoloading**
   (PSR-4 via Composer). Move included "function libraries" toward classes.
8. Remove logic from the global scope; wrap top-level scripts in functions, then
   into classes/methods. Eliminate `global`; pass dependencies in.

## Phase 2 — Break dependencies (Feathers)

9. Identify **seams**: places you can change behavior without editing in place.
10. Convert hidden dependencies (globals, `new` in the middle of logic,
    singletons, `date()`, `$_SESSION`, `$_GET`, DB connections, `header()`,
    `echo`) into **injected collaborators** behind interfaces.
11. Use dependency-breaking moves: *Extract Method → Extract Class →
    Parameterize Constructor → Introduce Interface → Inject*.

## Phase 3 — Extract the layers

12. Separate the three concerns Jones repeatedly pulls apart:
    - **Domain / business logic** (pure, framework-free, testable).
    - **Persistence** (gateways/repositories; isolate SQL and `$_SESSION`/files).
    - **Presentation** (templating; isolate `echo`/HTML/`header()`).
13. Drive HTTP through controllers/actions. Target **ADR** (Action-Domain-Responder,
    Jones's pattern) or classic MVC. Use PSR-7/15 messages + middleware where it fits.
14. Introduce a **DI container** (PSR-11) once construction graphs get deep.

## Phase 4 — Harden and standardize

15. Raise PHPStan/Psalm level incrementally; burn down the baseline.
16. Enforce PSR-12 in CI; add type declarations (params, returns, properties),
    `declare(strict_types=1)`, enums, readonly props, constructor promotion,
    first-class callables — modern PHP 8.x idioms.
17. Apply SOLID where it removes real pain (don't over-abstract):
    - **S**ingle responsibility per class.
    - **O**pen/closed via polymorphism over `switch`/type flags.
    - **L**iskov: subtypes honor contracts.
    - **I**nterface segregation: small role interfaces.
    - **D**ependency inversion: depend on interfaces, inject implementations.
18. Replace procedural conditionals/flags with patterns where warranted
    (Strategy, Factory, Repository, Adapter, Decorator, Value Object, Null Object).

## Phase 5 — Migrate at scale (Strangler Fig)

19. For large systems, route new/converted features through the new OOP stack
    while the legacy path still serves the rest; shrink the legacy surface
    feature-by-feature until it's gone. Never a flag-day cutover.

## Invariants the expert enforces on every step

- **Behavior-preserving**: each refactor keeps tests green; new behavior is a
  separate, tested change.
- **Small commits**: one named refactoring per commit, app runnable throughout.
- **Tests before transformation**: no seam, no test, no change.
- **Automate the mechanical**: use Rector for the deterministic upgrades
  (see `tooling.md`) and reserve human/LLM judgment for design decisions.
- **Standards are non-negotiable**: PSR-4 autoloading, PSR-12 style, typed code.
