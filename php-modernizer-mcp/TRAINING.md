# Training the PHP Modernizer into a robust, reusable system

This expert is **not** a fine-tuned model — and that is deliberate. It is a
*deterministic, version-controlled, reviewable* knowledge system. "Training" it
means curating four surfaces, all of them plain files you can diff and revert:

1. **The ruleset** — `knowledge/rules.yaml` (smell → move → authority).
2. **The golden examples** — `knowledge/golden/*.md` (before→after exemplars).
3. **The methodology & principles** — the other `knowledge/*.md` docs.
4. **The feedback log** — `feedback/feedback.jsonl` (what the team accepted/rejected).

The loop: **use it → record feedback → review the summary → edit the four
surfaces → repeat.** Each pass makes it sharper and more aligned to your house
style. Below is how to do each step well.

---

## Why this design (and not a fine-tune)

- **Reviewable.** Every "lesson" is a line in `rules.yaml` or a markdown example,
  visible in code review and `git blame`.
- **Reversible.** A bad lesson is `git revert`, not a retrain.
- **Portable & reusable.** Point `PHP_MODERNIZER_PROJECT_DIR` at any PHP project;
  the same trained brain applies. Fork the `knowledge/` dir per client/house style.
- **Grounded.** Conversions cite a named refactoring and an authority, so output
  is auditable, not vibes.

---

## Stage 1 — Baseline (do once)

1. `npm install && npm run build`, wire it into your MCP client (see README).
2. Point it at a real legacy project: `PHP_MODERNIZER_PROJECT_DIR=...`.
3. Install the PHP toolchain in that project so the integration tools work:
   ```bash
   composer require --dev rector/rector phpstan/phpstan \
     friendsofphp/php-cs-fixer squizlabs/php_codesniffer phpunit/phpunit
   ```
4. Run `assess_codebase`. Read the report. This is your starting "debt map".

---

## Stage 2 — Use it on real conversions (generate signal)

For each file, run the **`modernize-file`** prompt. It enforces the safe order:
characterization tests → Rector dry-run → `convert_snippet` → PHPStan/phpcs →
tests green → `review_conversion` → `record_feedback`.

**The single most important habit: call `record_feedback` every time.**
- `accepted` — the suggestion shipped as-is.
- `revised` — good direction, but you changed it (say *how* in `notes`).
- `rejected` — wrong move here (say *why*).
Always attach the `ruleId` when the outcome traces to one. This is the raw
training signal.

---

## Stage 3 — Read the signal

Run `get_feedback_summary` (or the **`train-the-expert`** prompt). It reports:
- Overall accept/reject/revise rates.
- **Per-rule** outcomes, most-contested first → your refinement queue.
- **Blind spots**: rules with zero feedback → either irrelevant to your code
  (consider removing) or untested (go exercise them).

Decision guide:
| Signal | Action |
|---|---|
| Rule often **rejected** | Its `move` is wrong for your context, or `detect` is too broad (false positives). Fix or narrow it. |
| Rule often **revised** | The direction is right but the exemplar is off. Add/replace a golden example showing the *accepted* shape. |
| Rule **never fires** but the smell exists | `detect` regex misses your idiom. Broaden it. |
| Smell with **no rule** | Add a new rule (see below). |
| Rule with **no feedback** and irrelevant | Delete it — keep the ruleset lean. |

---

## Stage 4 — Edit the four surfaces

### 4a. Add or refine a rule (`knowledge/rules.yaml`)
Each rule is:
```yaml
- id: kebab-case-unique-id
  smell: "Human description of the procedural pattern."
  detect: 'a PHP-flavored regex (case-insensitive, line-by-line)'
  move: "The named refactoring / OOP move to apply."
  principle: [SRP, DIP]          # SOLID etc.
  authority: "Who says so (Fowler/Feathers/Jones/PSR-n/GoF)."
  tooling: [rector, phpstan]     # tools that help automate/verify
  severity: high|medium|low
```
Guidelines:
- Keep `detect` **specific** — prefer false negatives over noisy false positives;
  noisy rules erode trust and `assess_codebase` reports.
- Always cite a real `authority`. No authority → it's an opinion, not a rule.
- Test your regex against real files: re-run `assess_codebase` after editing.

### 4b. Add a golden example (`knowledge/golden/<concern>.md`)
One concern per file (mirror `globals-to-di.md`): the **Before**, the **After**,
and a table mapping each change to its `rule id` + authority. `convert_snippet`
feeds *all* golden examples to the model, so these are how you teach house style
(naming, layering, how strict, how much abstraction).

### 4c. Tune methodology / principles / rubric
- Adjust phase emphasis in `methodology.md` (e.g. your shop ships behind feature
  flags → strengthen the Strangler phase).
- Tighten `rubric.md` thresholds to raise the acceptance bar as the team levels up.
- Add framework-specific guidance (Laravel/Symfony) as new `knowledge/*.md` files
  and reference them from `methodology.md`.

### 4d. Version & changelog
Bump `version:` in `rules.yaml` and add an entry to the changelog below on every
substantive change, so improvements are traceable.

---

## Stage 5 — Make it reusable across projects/teams

- **One brain, many projects:** keep `php-modernizer-mcp` installed once; switch
  `PHP_MODERNIZER_PROJECT_DIR` per project. The trained `knowledge/` travels.
- **House-style forks:** copy `knowledge/` per client and point
  `PHP_MODERNIZER_KNOWLEDGE_DIR` at the right one.
- **Team-shared learning:** commit `knowledge/` *and* `feedback/feedback.jsonl`
  to a shared repo so everyone's reviews compound into the same brain. (If the
  log should stay local, gitignore it — see `.gitignore`.)
- **CI guardrail:** run `run_phpstan` + `run_phpcs` (and PHPUnit) in CI so the
  standards the expert targets are enforced mechanically, not just suggested.

---

## Quick reference: the training loop

```
assess_codebase ─▶ modernize-file (per file) ─▶ record_feedback
        ▲                                              │
        └──── edit rules.yaml / golden / docs ◀── get_feedback_summary
```

Run the loop weekly (or per sprint). Within a few cycles the ruleset reflects
*your* codebase's real smells and *your* team's accepted OOP shapes — a robust,
reusable modernization system rather than generic advice.

---

## Changelog

- **v2 (rules.yaml)** — Best-practice training pass. Added 12 rules
  (sql-injection-risk, header-in-logic, session-start-in-logic,
  exit-die-in-logic, error-suppression, extract-compact, globals-array,
  eval-usage, create-function, each-deprecated, goto-usage, debug-output,
  mixed-concerns-file). Added `scope: file` rule support and converted
  `no-strict-types` + `mixed-concerns-file` to file scope to eliminate
  per-line noise (false-positive reduction — the noisy rule was inflating
  reports). Added knowledge docs `modern-php.md` (8.x idioms) and
  `anti-patterns.md` (over-modernization / YAGNI discipline). Added golden
  examples: switch→strategy, inline-sql→repository, superglobals→ADR,
  error-codes→exceptions. Added `examples/legacy/` validation fixture
  (assessment detects all 18 distinct smell categories).
- **v1 (rules.yaml)** — Initial ruleset: 10 core procedural→OOP smells
  (globals, superglobals, buried `new`, switch-on-type, time-in-logic,
  echo/HTML-in-logic, raw DB calls, error codes, include chains,
  static service locators, missing strict types).
