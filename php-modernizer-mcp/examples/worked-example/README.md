# Worked example: legacy procedural PHP → clean, tested OOP

This is the whole point made concrete. One small feature — "register a user" —
shown **before** (legacy procedural) and **after** (modern OOP), with a passing
test suite proving the modern version behaves correctly.

## Try it (≈30 seconds)

```bash
cd examples/worked-example
php bin/demo.php          # runs with zero dependencies

composer install         # then the real test suite:
composer test            # PHPUnit → OK (5 tests, 10 assertions)
```

## Before — `legacy/user_functions.php`

A single procedural function that does everything: reaches a `global $db`,
builds SQL by string interpolation (injection-prone), `echo`s errors, calls
`date()` and `mail()` directly, and signals failure with `return false`. It is
untestable without a live database and a mail server.

## After — `src/`

Split into small, typed, injected pieces (the layers from the methodology):

| File | Role | Replaces |
|---|---|---|
| `User/Email.php` | Value object — validates + normalizes on construction | scattered `filter_var` + `echo "Bad email"` |
| `User/User.php` | Immutable domain entity | a raw associative array |
| `User/UserRepository.php` | Persistence **interface** | `global $db` + inline SQL |
| `User/InMemoryUserRepository.php` | A real, DB-free implementation | the `INSERT`/`SELECT` strings |
| `Notification/Mailer.php` | Notification **interface** | the bare `mail()` call |
| `Clock/Clock.php` + `SystemClock.php` | Injected time (PSR-20 shaped) | `date('Y-m-d H:i:s')` |
| `User/RegisterUser.php` | The use-case — orchestrates the above | the whole tangled function |
| `User/InvalidEmail.php`, `DuplicateUser.php` | Typed exceptions | `return false` |

Every dependency is injected, so in tests we pass a `FixedClock`, an in-memory
repository, and a `SpyMailer` (see `tests/Support/`) — no database, no email,
fully deterministic.

## What this demonstrates (mapped to the authorities)

- **Inject dependencies** (Feathers / DIP) — `global`, `new`, `date()`, `mail()`
  all become constructor parameters.
- **Isolate persistence** behind a Repository (Fowler PoEAA) with prepared
  statements, not interpolation (OWASP).
- **Separate presentation** — no `echo` in the domain (Jones / SRP).
- **Replace error codes with exceptions** (Fowler).
- **Value objects + types + `readonly`** (modern PHP / DDD).
- **Tests first** — the safety net that makes all of the above safe (Feathers).

The same transformation, rule-by-rule, is what the MCP's `convert_snippet`,
`assess_codebase`, and `run_phpunit` tools drive on your real code.
