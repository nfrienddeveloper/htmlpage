import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveBinary, run, formatExec } from "../util/exec.js";
import { loadRules } from "../knowledge.js";
import { scanTree } from "../util/scan.js";
import { config } from "../config.js";

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

export function registerIntegrationTools(server: McpServer): void {
  // ── assess_codebase ───────────────────────────────────────────────────────
  server.registerTool(
    "assess_codebase",
    {
      title: "Assess a PHP codebase",
      description:
        "Scan a PHP directory for procedural smells using the ruleset and produce a prioritized " +
        "modernization report (counts by rule/severity, worst files). Deterministic, no tools " +
        "required. Optionally combine with run_phpstan for type-level findings.",
      inputSchema: {
        path: z.string().optional().describe("Directory or file to scan. Default: PHP_MODERNIZER_PROJECT_DIR."),
        maxFiles: z.number().int().positive().max(5000).optional().describe("Cap on files scanned (default 2000)."),
      },
    },
    async ({ path, maxFiles }) => {
      const root = path ?? config.projectDir;
      const ruleSet = loadRules();
      const reports = scanTree(root, ruleSet.rules, maxFiles ?? 2000);

      const byRule = new Map<string, number>();
      const bySeverity = new Map<string, number>();
      let total = 0;
      for (const r of reports) {
        for (const h of r.hits) {
          total++;
          byRule.set(h.ruleId, (byRule.get(h.ruleId) ?? 0) + 1);
          bySeverity.set(h.severity, (bySeverity.get(h.severity) ?? 0) + 1);
        }
      }

      if (total === 0) {
        return text(`# Assessment of ${root}\n\nNo procedural smells detected by the ruleset across the scanned PHP files. Either the code is already modernized or the ruleset needs new rules for this codebase's patterns (see TRAINING.md).`);
      }

      const ruleLines = [...byRule.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, n]) => `| ${id} | ${n} |`)
        .join("\n");
      const worst = reports
        .map((r) => ({ file: r.file, n: r.hits.length }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 15)
        .map((f) => `| ${f.file} | ${f.n} |`)
        .join("\n");
      const sev = ["high", "medium", "low"]
        .map((s) => `${s}: ${bySeverity.get(s) ?? 0}`)
        .join(", ");

      return text(
        `# Assessment of ${root}\n\n` +
          `Files with smells: **${reports.length}** · Total findings: **${total}** · Severity → ${sev}\n\n` +
          `## Findings by rule\n| rule | hits |\n|---|---|\n${ruleLines}\n\n` +
          `## Highest-debt files\n| file | hits |\n|---|---|\n${worst}\n\n` +
          `## Next step\nFeed the worst files (highest severity first) to \`convert_snippet\`, after ` +
          `\`generate_characterization_tests\`. Use \`plan_migration\` for the overall sequence. ` +
          `Run \`run_phpstan\` and \`run_rector\` (dry-run) for type/mechanical findings this ` +
          `regex scan can't see.`,
      );
    },
  );

  // ── generic PHP-tool runner factory ───────────────────────────────────────
  const tool = resolveBinary;

  // ── run_rector ────────────────────────────────────────────────────────────
  server.registerTool(
    "run_rector",
    {
      title: "Run Rector (automated refactoring)",
      description:
        "Run rector/rector to apply or preview AST-based modernization (PHP upgrades, type " +
        "declarations, dead-code, code-quality). Defaults to --dry-run so nothing changes until " +
        "you've reviewed the diff. Reserve Rector for MECHANICAL upgrades; design refactors stay " +
        "with convert_snippet.",
      inputSchema: {
        path: z.string().describe("Path (relative to project) to process."),
        dryRun: z.boolean().optional().describe("Preview only. Default true. Set false to APPLY changes."),
        configPath: z.string().optional().describe("rector.php config to use (--config)."),
      },
    },
    async ({ path, dryRun, configPath }) => {
      const args = ["process", path];
      if (dryRun !== false) args.push("--dry-run");
      if (configPath) args.push("--config", configPath);
      const r = await run(tool("rector"), args);
      return text(formatExec(dryRun === false ? "rector (APPLIED)" : "rector --dry-run", r));
    },
  );

  // ── run_phpstan ───────────────────────────────────────────────────────────
  server.registerTool(
    "run_phpstan",
    {
      title: "Run PHPStan (static analysis)",
      description:
        "Run PHPStan to find type/null/contract bugs that procedural→OOP refactors expose. Use " +
        "--generate-baseline to freeze existing errors, then burn the baseline down as you modernize.",
      inputSchema: {
        path: z.string().describe("Path to analyse."),
        level: z.number().int().min(0).max(10).optional().describe("Rule level 0–9/max. Default: use phpstan.neon."),
        generateBaseline: z.boolean().optional().describe("Write a baseline instead of failing."),
      },
    },
    async ({ path, level, generateBaseline }) => {
      const args = ["analyse", path, "--no-progress"];
      if (typeof level === "number") args.push("--level", String(level));
      if (generateBaseline) args.push("--generate-baseline");
      const r = await run(tool("phpstan"), args);
      return text(formatExec("phpstan", r));
    },
  );

  // ── run_phpcs (PSR-12 style) ──────────────────────────────────────────────
  server.registerTool(
    "run_phpcs",
    {
      title: "Run PHP_CodeSniffer (PSR-12)",
      description:
        "Check PSR-12 coding-style compliance with phpcs. Pair with phpcbf/php-cs-fixer to auto-fix.",
      inputSchema: {
        path: z.string().describe("Path to check."),
        standard: z.string().optional().describe("Coding standard. Default PSR12."),
        fix: z.boolean().optional().describe("If true, run phpcbf to auto-fix instead of reporting."),
      },
    },
    async ({ path, standard, fix }) => {
      const std = standard ?? "PSR12";
      if (fix) {
        const r = await run(tool("phpcbf"), [`--standard=${std}`, path]);
        return text(formatExec("phpcbf (auto-fix)", r));
      }
      const r = await run(tool("phpcs"), [`--standard=${std}`, path]);
      return text(formatExec("phpcs", r));
    },
  );

  // ── run_phpunit ───────────────────────────────────────────────────────────
  server.registerTool(
    "run_phpunit",
    {
      title: "Run PHPUnit (the safety net)",
      description:
        "Run the test suite (or a filter) to confirm a refactor preserved behavior. Run before AND " +
        "after every conversion — green tests are the precondition for accepting a change.",
      inputSchema: {
        filter: z.string().optional().describe("--filter pattern to run a subset."),
        testPath: z.string().optional().describe("Specific test file/dir to run."),
      },
    },
    async ({ filter, testPath }) => {
      const args: string[] = [];
      if (filter) args.push("--filter", filter);
      if (testPath) args.push(testPath);
      const r = await run(tool("phpunit"), args);
      return text(formatExec("phpunit", r));
    },
  );
}
