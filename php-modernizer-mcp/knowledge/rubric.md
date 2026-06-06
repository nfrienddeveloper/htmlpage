# Conversion Review Rubric

`review_conversion` grades a proposed OOP conversion against these criteria.
Score each 0–2 (0 = absent, 1 = partial, 2 = solid). A conversion should not be
accepted below the listed minimums. Edit thresholds to tune house standards.

| # | Criterion | What "solid" (2) looks like | Min |
|---|-----------|------------------------------|-----|
| 1 | Behavior preserved | Characterization/unit tests exist and pass; no behavior change smuggled in | 2 |
| 2 | Dependencies injected | No `global`, no `new`/static service access in logic; collaborators injected | 2 |
| 3 | Single responsibility | One coherent reason to change; persistence/presentation/domain separated | 1 |
| 4 | Depends on abstractions | Collaborators behind interfaces where a seam/test double is needed (DIP) | 1 |
| 5 | Typed & strict | `declare(strict_types=1)`, param/return/property types; PHPStan-clean | 2 |
| 6 | PSR compliant | PSR-4 location, PSR-12 style, PSR interfaces reused not reinvented | 2 |
| 7 | Error handling | Exceptions/typed returns over error codes & mixed returns | 1 |
| 8 | No over-engineering | Abstractions justified by real duplication/coupling (Rule of Three, YAGNI) | 1 |
| 9 | Migration safety | Reversible/strangler-friendly; app runnable; small commit | 1 |
| 10| Naming/domain fit | Names reflect the domain (DDD ubiquitous language), not the mechanism | 1 |

**Verdict:** ACCEPT if all minimums met and total ≥ 15/20; otherwise REQUEST CHANGES
with the specific failing criteria and the named refactoring to apply next.
