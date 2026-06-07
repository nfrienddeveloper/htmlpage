# Modernization anti-patterns (what NOT to do)

A best-practice expert is defined as much by restraint as by patterns. These are
the failure modes the expert actively guards against. `review_conversion` should
fail a conversion that commits any of these, even if it "looks OOP".

## Process anti-patterns
- **Big-bang rewrite.** Rewriting from scratch instead of incremental,
  behavior-preserving refactoring. (Jones, Fowler: never.) Use Strangler Fig.
- **Refactoring without tests.** Changing tangled code with no characterization
  net. (Feathers.) No seam, no test, no change.
- **Mixing refactor + feature.** A commit that both restructures and changes
  behavior. Keep them separate so regressions are bisectable.
- **Boiling the ocean.** Modernizing low-traffic, stable code for purity's sake.
  Modernize what changes often or hurts; leave dormant code alone (or strangle last).

## Design anti-patterns (over-engineering — the YAGNI failures)
- **Interface for everything.** An interface with a single implementation and no
  test-double or extension need is ceremony. Extract an interface at a *seam*, not
  reflexively. (ISP/YAGNI.)
- **Strategy for a two-branch switch.** Replacing a tiny, stable `if/else` with a
  Strategy hierarchy adds indirection without payoff. Apply polymorphism when the
  switch is duplicated or volatile (Rule of Three).
- **Anemic domain model.** Data-only classes with getters/setters while logic
  lives in "service" procedures elsewhere. That's procedural code in OOP clothing.
  Put behavior with its data (Tell, Don't Ask).
- **Setter injection / service locator everywhere.** Hidden dependencies pulled
  from a container at runtime. Prefer explicit constructor injection.
- **Premature abstraction / speculative generality.** Building extension points
  for needs that don't exist yet. (YAGNI.)
- **Deep inheritance trees.** Using inheritance for code reuse instead of
  composition; violates LSP the moment a subtype diverges.
- **God service.** Renaming the god-file `Manager`/`Helper`/`Util` class and
  calling it OOP. Split by responsibility.

## Standards anti-patterns
- Reinventing PSR interfaces (a bespoke logger/container/HTTP message) instead of
  reusing `psr/*`.
- Hand-formatting instead of enforcing PSR-12 via php-cs-fixer in CI.
- `require`/autoloader hybrids — half migrated to PSR-4.

## The restraint checklist (apply before adding any abstraction)
1. Is there real duplication or a real seam need *right now*? (Rule of Three.)
2. Will a test become possible/easier because of this change? If not, defer it.
3. Is this the *smallest* design that removes the coupling? If a function or a
   value object suffices, don't add a pattern.
4. Does the name reflect the domain, not the mechanism?
