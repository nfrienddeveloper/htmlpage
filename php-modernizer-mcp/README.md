# PHP Modernizer MCP

An **MCP (Model Context Protocol) server that is an expert at converting legacy
procedural PHP into clean, tested, PSR-compliant OOP** — and a *reusable system*
you train over time.

It doesn't just give opinions. It encodes the canonical methodology, detects
procedural smells, prescribes the named refactoring + authority for each, runs
the real PHP toolchain (Rector, PHPStan, PHP-CS-Fixer, PHPUnit), grades the
result against a rubric, and **learns** from a feedback log you curate.

## The power tool: `php-modernize`

One command turns procedural PHP toward modern OOP. Safe **dry-run by default**;
add `--apply` to write. It chains the whole deterministic pipeline:

```bash
npm install && npm run build      # once

# point it at any file or directory in your PHP project:
PHP_MODERNIZER_PROJECT_DIR=/path/to/project \
  npx php-modernize src/legacy.php --php 8.3

# happy with the preview? write the changes:
PHP_MODERNIZER_PROJECT_DIR=/path/to/project \
  npx php-modernize src/legacy.php --php 8.3 --apply
```

What each run does:

| Step | Tool | Result |
|---|---|---|
| 1. Assess | ruleset scan | prioritized procedural-smell report |
| 2. Upgrade | **Rector** | strict types, return/param types, dead code, early returns, `switch`→`match`, PHP-version idioms |
| 3. Style | **PHP-CS-Fixer** | PSR-12 (with `--apply`) |
| 4. Verify | **PHPStan + PHPUnit** | confirms it still type-checks and tests pass |
| 5. Design | knowledge base | the rule-grounded to-do for what only judgment can do (extract classes, inject deps) — hand these to the MCP's `convert_snippet` |

Real transformation it produced on a procedural file (excerpt):

```diff
+declare(strict_types=1);

-function is_eligible_for_discount($customer)
+function is_eligible_for_discount(array $customer): bool
 {
-    if ($customer['orders'] > 10) {
-        return true;
-    } else {
-        return false;
-    }
+    return $customer['orders'] > 10;
 }

-    switch ($status) { case 'paid': $label = 'Paid'; break; ... }
+    return match ($status) { 'paid' => 'Paid', 'pending' => 'Pending', default => 'Unknown' };
```

The CLI does the mechanical 80%; the MCP server (below) drives the design-level
20% — extracting classes, injecting dependencies, building value objects.

### Run it on a local repo (one step)

For a project that only lives on your machine (not reachable from a cloud
session), use the launcher — run it from **inside** the project:

```bash
# once: clone the tool anywhere
git clone -b claude/php-oop-conversion-mcp-M9bI8 \
  https://github.com/nfrienddeveloper/htmlpage.git

# in your project:
cd /path/to/your-project
/path/to/htmlpage/php-modernizer-mcp/modernize.sh --setup        # installs Rector/PHPStan/CS-Fixer here (once)
/path/to/htmlpage/php-modernizer-mcp/modernize.sh src --php 8.3   # dry-run (writes nothing)
/path/to/htmlpage/php-modernizer-mcp/modernize.sh src --php 8.3 --apply
```

`modernize.sh` builds itself on first run and targets your current directory
automatically — no env vars, no Node path juggling. (Prefer a global command?
`cd php-modernizer-mcp && npm install && npm run build && npm link`, then just
`php-modernize src --php 8.3` from anywhere.)

## See it work in 30 seconds

A complete before→after modernization with a passing test suite lives in
[`examples/worked-example/`](./examples/worked-example/) — one legacy procedural
function turned into clean, injected, tested OOP:

```bash
cd examples/worked-example
php bin/demo.php       # runs with zero dependencies
composer install && composer test   # PHPUnit → OK (5 tests, 10 assertions)
```

## The authority it's built on

The methodology is taken from the most respected sources for *this specific task*:

- **Paul M. Jones — _Modernizing Legacy Applications in PHP_** — the definitive,
  step-by-step, no-rewrite playbook (the phase order in `knowledge/methodology.md`).
- **Michael Feathers — _Working Effectively with Legacy Code_** — seams &
  characterization tests (the safety net).
- **Martin Fowler — _Refactoring_** (+ Strangler Fig) — the named transformations.
- **Robert C. Martin** — SOLID & clean architecture.
- **PHP-FIG / PSR** — PSR-1/4/12, PSR-3/7/11/15/20… the interoperability law.
- Tooling: **Rector**, **PHPStan/Psalm**, **PHP-CS-Fixer/phpcs**, **PHPUnit**, **Composer**.

The editable knowledge base (`knowledge/`) ships pre-trained with: `methodology.md`,
`principles.md`, `psr.md`, `refactorings.md`, `tooling.md`, `modern-php.md` (8.x
idioms), `anti-patterns.md` (over-modernization / YAGNI guards), a 23-rule
`rules.yaml`, a review `rubric.md`, and 5 golden before/after exemplars under
`knowledge/golden/`. A `examples/legacy/` fixture lets you see detection working
out of the box (`assess_codebase` flags all 18 distinct smell categories).

## What it exposes

### Tools
| Tool | Purpose |
|---|---|
| `get_methodology` | The phased playbook (methodology/principles/psr/refactorings/tooling). |
| `plan_migration` | An ordered, safety-net-first plan tailored to your codebase. |
| `assess_codebase` | Scan a PHP tree for procedural smells; prioritized debt report. |
| `convert_snippet` | Detect smells in a snippet → prescribed OOP moves + golden examples + recipe. |
| `generate_characterization_tests` | PHPUnit safety-net scaffolding (Feathers). |
| `review_conversion` | Grade a before→after against the rubric; ACCEPT / REQUEST CHANGES. |
| `suggest_patterns` | Principle/pattern catalog for a described problem (with a YAGNI guard). |
| `run_rector` | Automated AST refactoring (dry-run by default). |
| `run_phpstan` | Static analysis / baseline. |
| `run_phpcs` | PSR-12 style check / auto-fix. |
| `run_phpunit` | Run the test suite to prove behavior is preserved. |
| `record_feedback` | Log a conversion outcome (accepted/rejected/revised) — trains the expert. |
| `get_feedback_summary` | Aggregate the log; surface rules to refine and blind spots. |

### Prompts (slash-commands in MCP clients)
`modernize-file`, `extract-class`, `break-dependencies`,
`plan-strangler-migration`, `train-the-expert`.

### Resources
The whole knowledge base at `php-modernizer://knowledge/<file>` — browsable and
readable by the client.

## Install & build

```bash
cd php-modernizer-mcp
npm install
npm run build
```

## Configure your editor / client

Add to your MCP client config (e.g. Claude Desktop `claude_desktop_config.json`,
Claude Code, Cursor):

```json
{
  "mcpServers": {
    "php-modernizer": {
      "command": "node",
      "args": ["/absolute/path/to/php-modernizer-mcp/dist/index.js"],
      "env": {
        "PHP_MODERNIZER_PROJECT_DIR": "/absolute/path/to/the/php/project/you/are/modernizing"
      }
    }
  }
}
```

### Environment variables
| Var | Meaning | Default |
|---|---|---|
| `PHP_MODERNIZER_PROJECT_DIR` | The PHP project to modernize (where `vendor/bin` lives). | cwd |
| `PHP_MODERNIZER_KNOWLEDGE_DIR` | Override the knowledge base location. | `./knowledge` |
| `PHP_MODERNIZER_FEEDBACK_FILE` | Learning-log path. | `./feedback/feedback.jsonl` |
| `PHP_MODERNIZER_ALLOW_EXEC` | Set `false` for advisory-only (no shelling out). | `true` |
| `PHP_MODERNIZER_TOOL_TIMEOUT_MS` | Per-tool timeout. | `120000` |
| `PHP_MODERNIZER_{RECTOR,PHPSTAN,PSALM,PHPCS,PHP_CS_FIXER,PHPUNIT,COMPOSER}_BIN` | Explicit binary paths. | auto-discover |

Binary discovery order: explicit env → `<projectDir>/vendor/bin/<tool>` → `PATH`.

## Typical workflow

1. `assess_codebase` → see where the debt is.
2. `plan_migration` → get the ordered, safety-first plan.
3. Per file: run the **`modernize-file`** prompt (it orchestrates tests → Rector
   → convert → PHPStan/phpcs → tests → review → feedback).
4. Periodically run the **`train-the-expert`** prompt to fold the feedback log
   back into the ruleset.

## Inspect locally

```bash
npm run inspect   # opens the MCP Inspector against the server
```

## Training it into a robust, reusable system

See **[TRAINING.md](./TRAINING.md)** — the full guide.
