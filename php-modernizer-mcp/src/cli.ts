#!/usr/bin/env node
/**
 * php-modernize — a one-command power tool that drives procedural PHP toward OOP.
 *
 *   php-modernize <path> [--apply] [--php 8.3] [--skip-tests]
 *
 * Pipeline:
 *   1. ASSESS    scan for procedural smells (deterministic, from rules.yaml)
 *   2. UPGRADE   run Rector (dry-run by default; --apply to write) for the
 *                mechanical OOP/modernization wins (types, dead code, early
 *                returns, code quality, PHP version idioms)
 *   3. STYLE     PHP-CS-Fixer to PSR-12 (only with --apply)
 *   4. VERIFY    PHPStan + PHPUnit so you know it still works
 *   5. DESIGN    print the rule-grounded briefing for the work only a human/LLM
 *                can do (extract classes, inject deps) — what Rector won't touch
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { config } from "./config.js";
import { loadRules } from "./knowledge.js";
import { scanTree } from "./util/scan.js";
import { resolveBinary, run, type ExecResult } from "./util/exec.js";

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", cyan: "\x1b[36m",
};
const c = (color: keyof typeof C, s: string) => `${C[color]}${s}${C.reset}`;

function getFlagValue(argv: string[], name: string): string | undefined {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=")[1];
  const i = argv.indexOf(`--${name}`);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  return undefined;
}

function banner(step: string, title: string): void {
  console.log("\n" + c("bold", c("cyan", `▌ ${step}  ${title}`)));
}

function printExec(r: ExecResult): boolean {
  console.log(c("dim", `  $ ${r.command}`));
  if (r.error) {
    console.log(c("yellow", `  ⚠ ${r.error}`));
    return false;
  }
  const out = [r.stdout.trim(), r.stderr.trim()].filter(Boolean).join("\n");
  if (out) console.log(out.split("\n").map((l) => "  " + l).join("\n"));
  console.log(r.ok ? c("green", "  ✓ ok") : c("red", `  ✗ exit ${r.exitCode}`));
  return r.ok;
}

function writeRectorConfig(absPaths: string[], php?: string): string {
  const phpSet =
    php === "8.4" ? "->withPhpSets(php84: true)"
    : php === "8.3" ? "->withPhpSets(php83: true)"
    : php === "8.2" ? "->withPhpSets(php82: true)"
    : php === "8.1" ? "->withPhpSets(php81: true)"
    : "->withPhpSets()";
  const body = `<?php

declare(strict_types=1);

use Rector\\Config\\RectorConfig;

return RectorConfig::configure()
    ->withPaths(${JSON.stringify(absPaths)})
    ${phpSet}
    ->withPreparedSets(
        deadCode: true,
        codeQuality: true,
        codingStyle: true,
        typeDeclarations: true,
        privatization: true,
        earlyReturn: true,
    );
`;
  const path = join(tmpdir(), `php-modernize-rector-${Date.now()}.php`);
  writeFileSync(path, body, "utf8");
  return path;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    console.log(`${c("bold", "php-modernize")} — procedural PHP → OOP power tool

${c("bold", "Usage:")} php-modernize <path> [options]

${c("bold", "Options:")}
  --apply         Write changes (Rector + PSR-12). Default is a safe dry-run.
  --php <ver>     Target PHP version for idioms (e.g. 8.3). Default: latest.
  --skip-tests    Don't run PHPUnit at the end.
  -h, --help      Show this help.

${c("dim", "Set PHP_MODERNIZER_PROJECT_DIR to the project root if you run it elsewhere.")}`);
    process.exit(argv.length === 0 ? 1 : 0);
  }

  const target = argv.find((a) => !a.startsWith("--"))!;
  const apply = argv.includes("--apply");
  const skipTests = argv.includes("--skip-tests");
  const php = getFlagValue(argv, "php");
  const absTarget = resolve(config.projectDir, target);

  console.log(c("bold", `\n🔧 php-modernize  →  ${absTarget}`));
  console.log(c("dim", `   project: ${config.projectDir}  ·  mode: ${apply ? c("yellow", "APPLY (writes files)") : "dry-run (safe)"}${php ? `  ·  php ${php}` : ""}`));

  // ── 1. ASSESS ──────────────────────────────────────────────────────────────
  banner("1/5", "Assess — procedural smells");
  const ruleSet = loadRules();
  const reports = scanTree(absTarget, ruleSet.rules);
  const byRule = new Map<string, number>();
  let total = 0;
  for (const r of reports) for (const h of r.hits) { total++; byRule.set(h.ruleId, (byRule.get(h.ruleId) ?? 0) + 1); }
  if (total === 0) {
    console.log(c("green", "  ✓ No ruleset smells detected — already looking modern."));
  } else {
    console.log(`  ${c("bold", String(total))} findings across ${c("bold", String(reports.length))} file(s):`);
    [...byRule.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, n]) =>
      console.log(`    ${c("yellow", "•")} ${id} ${c("dim", `×${n}`)}`));
  }

  // ── 2. UPGRADE (Rector) ─────────────────────────────────────────────────────
  banner("2/5", apply ? "Upgrade — Rector (APPLYING)" : "Upgrade — Rector (preview)");
  const cfg = writeRectorConfig([absTarget], php);
  const rectorArgs = ["process", absTarget, "--config", cfg, "--no-progress-bar"];
  if (!apply) rectorArgs.push("--dry-run");
  const rector = await run(resolveBinary("rector"), rectorArgs);
  // Rector exits 2 in --dry-run when it FOUND changes — that's success here.
  const rectorChangesFound = !apply && rector.exitCode === 2;
  console.log(c("dim", `  $ ${rector.command}`));
  if (rector.error) {
    console.log(c("yellow", `  ⚠ ${rector.error}`));
  } else {
    const out = [rector.stdout.trim(), rector.stderr.trim()].filter(Boolean).join("\n");
    if (out) console.log(out.split("\n").map((l) => "  " + l).join("\n"));
    if (rector.ok) console.log(c("green", apply ? "  ✓ changes written" : "  ✓ no changes needed"));
    else if (rectorChangesFound) console.log(c("yellow", "  ➜ changes available — re-run with --apply to write them"));
    else console.log(c("red", `  ✗ exit ${rector.exitCode}`));
  }
  const rectorOk = rector.ok || rectorChangesFound;

  // ── 3. STYLE (PSR-12) ───────────────────────────────────────────────────────
  banner("3/5", "Style — PSR-12");
  if (apply) {
    const fixer = await run(resolveBinary("php-cs-fixer"), ["fix", absTarget, "--rules=@PSR12", "--using-cache=no"]);
    printExec(fixer);
  } else {
    console.log(c("dim", "  skipped in dry-run (run with --apply to format to PSR-12)"));
  }

  // ── 4. VERIFY ───────────────────────────────────────────────────────────────
  banner("4/5", "Verify — PHPStan + PHPUnit");
  const stan = await run(resolveBinary("phpstan"), ["analyse", absTarget, "--no-progress", "--level=5"]);
  printExec(stan);
  if (!skipTests) {
    const phpunit = await run(resolveBinary("phpunit"), []);
    printExec(phpunit);
  } else {
    console.log(c("dim", "  tests skipped (--skip-tests)"));
  }

  // ── 5. DESIGN briefing ──────────────────────────────────────────────────────
  banner("5/5", "Design — what Rector can't do (inject deps, extract classes)");
  const matched = ruleSet.rules.filter((r) => byRule.has(r.id) && (r.tooling ?? []).indexOf("rector") === -1);
  if (matched.length === 0) {
    console.log(c("green", "  ✓ Nothing left that needs human design judgment from the ruleset."));
  } else {
    console.log("  These smells need design decisions — use the MCP's convert_snippet for each:");
    for (const r of matched) {
      console.log(`    ${c("yellow", "•")} ${c("bold", r.id)} → ${r.move}`);
      if (r.authority) console.log(c("dim", `        ${r.authority}`));
    }
  }

  console.log("\n" + c("bold", apply ? c("green", "Done — changes written.") : "Dry-run complete."));
  if (!apply && (rectorOk || total > 0)) {
    console.log(c("dim", "Re-run with --apply to write the mechanical fixes, then tackle the Design list."));
  }
}

main().catch((e) => {
  console.error(c("red", `\nphp-modernize failed: ${e instanceof Error ? e.message : String(e)}`));
  process.exit(1);
});
