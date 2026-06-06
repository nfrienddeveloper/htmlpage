# PHP Modernizer MCP

An **MCP (Model Context Protocol) server that is an expert at converting legacy
procedural PHP into clean, tested, PSR-compliant OOP** — and a *reusable system*
you train over time.

It doesn't just give opinions. It encodes the canonical methodology, detects
procedural smells, prescribes the named refactoring + authority for each, runs
the real PHP toolchain (Rector, PHPStan, PHP-CS-Fixer, PHPUnit), grades the
result against a rubric, and **learns** from a feedback log you curate.

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

See `knowledge/` for the full, editable text.

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
