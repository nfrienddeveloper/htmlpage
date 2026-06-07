# Modern PHP idioms (8.x) — "bringing code up to date"

After breaking dependencies and extracting classes, apply current language
features. Most are mechanical and **Rector can apply them** (see `tooling.md`);
the expert still reviews for intent. Cite the version so callers target correctly.

## Types & safety
- `declare(strict_types=1);` at the top of every file.
- Full parameter, return, and **typed properties**; `void`, `never`, `static`,
  `self`, union (`A|B`), nullable (`?T`), and intersection (`A&B`) types.
- `mixed` only as a last resort; prefer precise types + PHPStan generics in docblocks.

## Class & object features
- **Constructor property promotion** (8.0): collapse boilerplate ctor assignments.
- **`readonly` properties** (8.1) / **`readonly` classes** (8.2): immutable value objects.
- **Enums** (8.1): replace class constants / magic strings used as a closed set;
  backed enums for persistence; methods on enums for behavior.
- **First-class callable syntax** (8.1): `$fn = strlen(...);` over string callables.
- **`new` in initializers** (8.1) for default object params.
- Named arguments (8.0) for clarity on optional/boolean params.

## Control flow & expressions
- **`match`** (8.0) over `switch` for value mapping (strict, exhaustive, returns).
- **Nullsafe operator** `?->` (8.0) over nested null checks.
- Null coalescing `??` / `??=`.
- **Throw as expression** (8.0): `$x = $v ?? throw new MissingValue();`.

## Errors & robustness
- Typed, hierarchical exceptions; never `@` suppression (rule `error-suppression`).
- In 8.0+ many warnings became `\TypeError`/`\ValueError` — lean into them.

## Mapping old → new (Rector sets that help)
| Legacy | Modern | Rector set |
|---|---|---|
| ctor assignments | promoted properties | `Php80SetList`, code quality |
| `switch` value-map | `match` | code quality |
| class consts as a set | `enum` | `Php81SetList` (+ review) |
| string callbacks | first-class callable | `Php81SetList` |
| nested `isset`/`?:` | `?->` / `??` | `Php80SetList` |
| inferred types missing | added types | `TYPE_DECLARATION` |

> Guard: modern syntax is the *last* step, not the first. Tests and dependency
> injection come before sugar. Don't let a syntax upgrade smuggle in a behavior
> change — keep characterization tests green across the upgrade.
