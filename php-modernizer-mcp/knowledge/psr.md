# PHP-FIG / PSR Cheat Sheet (the interoperability law)

The **PHP Framework Interop Group (PHP-FIG)** publishes the PSRs. These are the
de-facto standards modern PHP OOP must conform to. The expert enforces the
*accepted* ones and ignores deprecated ones.

## Must-follow for modernization

- **PSR-1 — Basic Coding Standard.** Files declare symbols *or* cause side
  effects, not both. `StudlyCaps` classes, `camelCase` methods, `UPPER_CASE`
  constants.
- **PSR-12 — Extended Coding Style** (supersedes the now-deprecated PSR-2).
  Bracing, spacing, imports, visibility, one statement per line. Enforce with
  PHP-CS-Fixer (`@PSR12`) or phpcs (`--standard=PSR12`).
  - Note: **PER Coding Style** (the PHP-FIG "PHP Evolving Recommendation") is the
    living successor that tracks new language features; target PER-CS 2.x if the
    team wants the latest, otherwise PSR-12 is the safe baseline.
- **PSR-4 — Autoloading.** Namespace ↔ directory mapping via Composer
  `autoload.psr-4`. This is the backbone of moving off `require`. One class per
  file, file path mirrors fully-qualified class name.

## Adopt as the design matures

- **PSR-3 — Logger Interface.** Inject `LoggerInterface` instead of `error_log`.
- **PSR-11 — Container Interface.** Standard DI container contract (`get`/`has`).
- **PSR-7 — HTTP Message Interfaces.** Immutable Request/Response objects;
  replaces touching `$_GET`/`$_POST`/`header()`/`echo` directly.
- **PSR-15 — HTTP Handlers & Middleware.** `RequestHandlerInterface` +
  `MiddlewareInterface` — the modern request pipeline.
- **PSR-17 — HTTP Factories.** Create PSR-7 objects.
- **PSR-18 — HTTP Client.** Standard outbound HTTP.
- **PSR-6 / PSR-16 — Caching** (pool vs. simple cache).
- **PSR-14 — Event Dispatcher.** Decouple via events instead of inline calls.
- **PSR-20 — Clock.** Inject `ClockInterface` instead of calling `time()`/`date()`
  — makes time a testable dependency (a classic Feathers seam).

## Deprecated / avoid

- **PSR-0** (legacy autoloading) — superseded by PSR-4.
- **PSR-2** — superseded by PSR-12 / PER-CS.

## Enforcement mapping

| Concern            | Tool                                  |
|--------------------|---------------------------------------|
| Style (PSR-12)     | php-cs-fixer `@PSR12`, phpcs PSR12     |
| Autoloading (PSR-4)| Composer `autoload.psr-4` + `dump-autoload` |
| Types / contracts  | PHPStan, Psalm                        |
| Interfaces (PSR-3/7/11/…) | pull from `psr/*` packages on Packagist |
