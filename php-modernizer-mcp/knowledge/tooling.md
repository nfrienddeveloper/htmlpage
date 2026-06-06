# PHP Tooling for Modernization (the automation layer)

The expert automates everything mechanical and reserves judgment for design.
These are the tools its integration commands shell out to.

## Rector — automated refactoring/upgrades (the deterministic workhorse)

- `rector/rector` applies thousands of safe, AST-based transformations: PHP
  version upgrades (e.g. PHP 7.4→8.3 sets), dead-code removal, type declaration
  inference, code-quality and early-return rules, and **framework-specific** sets.
- Use **dry-run first**: `vendor/bin/rector process <path> --dry-run`.
- Curate `rector.php` with rule SETS, not ad-hoc rules. Recommended starting sets:
  - `LevelSetList::UP_TO_PHP_83` (or your target) — language upgrades.
  - `SetList::CODE_QUALITY`, `SetList::DEAD_CODE`, `SetList::EARLY_RETURN`.
  - `SetList::TYPE_DECLARATION` — infer and add types.
  - `SetList::CODING_STYLE` (light; leave bulk style to php-cs-fixer).
- Rector handles *mechanical* modernization. It does **not** invent domain
  objects or split god-classes by responsibility — that's the LLM/human's job,
  guided by `methodology.md` and `principles.md`.

## PHPStan / Psalm — static analysis (the safety ratchet)

- Run at increasing `--level` (0→9 / `max`). Generate a **baseline** to freeze
  existing errors, then burn it down: `phpstan analyse --generate-baseline`.
- Catches the bugs that procedural→OOP refactors expose (undefined vars from old
  globals, wrong types, null handling).
- Add `phpstan/extension-installer` and framework extensions as relevant.

## PHP-CS-Fixer / PHP_CodeSniffer — style (PSR-12 / PER-CS)

- `php-cs-fixer fix --rules=@PSR12` (or a committed `.php-cs-fixer.dist.php`).
- `phpcs --standard=PSR12` to report, `phpcbf` to fix.
- Run in CI; never let style drift back.

## PHPUnit — tests (the net under every change)

- Characterization tests first (Phase 0), unit tests as you extract classes.
- Pair with **Infection** (mutation testing) to prove the tests actually pin
  behavior, not just execute it.

## Composer — dependencies & autoloading

- `composer init`; define `autoload.psr-4`; `composer dump-autoload -o`.
- Pull PSR interface packages (`psr/log`, `psr/container`, `psr/http-message`,
  `psr/clock`, …) and a container (e.g. `php-di/php-di`) as the design matures.

## Recommended order of operations per file/module

1. Characterization test (PHPUnit) → green.
2. `rector --dry-run` → review → apply mechanical upgrades → tests green.
3. LLM/human design refactor (extract classes, inject deps) guided by knowledge.
4. PHPStan level check (no new errors above baseline).
5. php-cs-fixer (PSR-12) → commit.

## Binary discovery (for this MCP's integration tools)

The integration tools look for binaries in this order:
1. Explicit env var (e.g. `PHP_MODERNIZER_RECTOR_BIN`).
2. `<projectDir>/vendor/bin/<tool>` (the normal Composer location).
3. `<tool>` on `PATH`.
Set `PHP_MODERNIZER_PROJECT_DIR` to the PHP project you are modernizing.
