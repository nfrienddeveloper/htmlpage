import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  readKnowledge,
  loadRules,
  loadGoldenExamples,
  type Rule,
} from "../knowledge.js";
import { scanSource } from "../util/scan.js";

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

function describeRule(r: Rule): string {
  return [
    `- **${r.id}** (${r.severity ?? "medium"}) — ${r.smell}`,
    `  - Move: ${r.move}`,
    r.authority ? `  - Authority: ${r.authority}` : "",
    r.principle?.length ? `  - Principles: ${r.principle.join(", ")}` : "",
    r.tooling?.length ? `  - Tooling: ${r.tooling.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function registerKnowledgeTools(server: McpServer): void {
  // ── get_methodology ───────────────────────────────────────────────────────
  server.registerTool(
    "get_methodology",
    {
      title: "Get modernization methodology",
      description:
        "Return the canonical, phased methodology for converting procedural PHP to OOP " +
        "(Paul M. Jones / Feathers / Fowler / SOLID / PSR). Use this to ground any plan " +
        "or conversion in accepted authority before acting.",
      inputSchema: {
        section: z
          .enum(["methodology", "principles", "psr", "refactorings", "tooling", "all"])
          .optional()
          .describe("Which knowledge document to return. Default: methodology."),
      },
    },
    async ({ section }) => {
      const pick = section ?? "methodology";
      if (pick === "all") {
        const docs = ["methodology", "principles", "psr", "refactorings", "tooling"];
        return text(docs.map((d) => `# === ${d}.md ===\n\n${readKnowledge(d + ".md")}`).join("\n\n"));
      }
      return text(readKnowledge(pick + ".md"));
    },
  );

  // ── plan_migration ────────────────────────────────────────────────────────
  server.registerTool(
    "plan_migration",
    {
      title: "Plan a modernization",
      description:
        "Produce an ordered, safety-net-first migration plan tailored to a described " +
        "codebase, grounded in the phased methodology. Returns the methodology spine plus " +
        "a directive instructing you to adapt it to the specifics provided.",
      inputSchema: {
        description: z.string().describe("Describe the codebase: size, frameworks, entry points, pain points, test status."),
        targetPhpVersion: z.string().optional().describe("e.g. '8.3'. Drives Rector level sets."),
        constraints: z.string().optional().describe("Deadlines, must-keep-running, team size, risk tolerance."),
      },
    },
    async ({ description, targetPhpVersion, constraints }) => {
      const methodology = readKnowledge("methodology.md");
      return text(
        `You are producing a modernization plan. Ground it in the methodology below and ` +
          `adapt EACH phase to the described system. Do not skip Phase 0 (safety net).\n\n` +
          `## Codebase\n${description}\n` +
          `## Target PHP\n${targetPhpVersion ?? "(unspecified — recommend one)"}\n` +
          `## Constraints\n${constraints ?? "(none stated)"}\n\n` +
          `## Methodology to apply\n${methodology}\n\n` +
          `## Deliver\nAn ordered checklist mapping each chosen step to: the named ` +
          `refactoring, the authority, the tool to automate it (Rector/PHPStan/etc.), and the ` +
          `exit test that keeps the app green. Call out the first 3 commits explicitly.`,
      );
    },
  );

  // ── convert_snippet ───────────────────────────────────────────────────────
  server.registerTool(
    "convert_snippet",
    {
      title: "Convert a procedural snippet to OOP",
      description:
        "Analyze a procedural PHP snippet, detect its smells against the ruleset, gather the " +
        "matching OOP moves + authorities + golden examples, and return an expert briefing that " +
        "instructs you exactly how to convert it (behavior-preserving, typed, PSR-compliant).",
      inputSchema: {
        snippet: z.string().describe("The procedural PHP code to convert."),
        context: z.string().optional().describe("Surrounding context: how it's called, what globals exist, framework."),
        targetPhpVersion: z.string().optional().describe("Target PHP version for idioms (default 8.3)."),
      },
    },
    async ({ snippet, context, targetPhpVersion }) => {
      const ruleSet = loadRules();
      const hits = scanSource(snippet, ruleSet.rules);
      const matchedIds = [...new Set(hits.map((h) => h.ruleId))];
      const matched = ruleSet.rules.filter((r) => matchedIds.includes(r.id));
      const golden = loadGoldenExamples();
      const recipe = readKnowledge("refactorings.md");

      const smellList = matched.length
        ? matched.map(describeRule).join("\n")
        : "- No ruleset smells auto-detected. Apply judgment using principles.md.";

      return text(
        `## Snippet to convert\n\`\`\`php\n${snippet}\n\`\`\`\n` +
          (context ? `\n## Context\n${context}\n` : "") +
          `\n## Detected smells & prescribed moves (from rules.yaml)\n${smellList}\n` +
          `\n## Golden references (match the house style)\n` +
          golden.map((g) => `### ${g.name}\n${g.content}`).join("\n\n") +
          `\n\n## Recipe to follow\n${recipe}\n` +
          `\n## Deliver\nTarget PHP ${targetPhpVersion ?? "8.3"}. Produce: (1) the converted OOP ` +
          `code with declare(strict_types=1), full types, and PSR-12 style; (2) any new ` +
          `interfaces/value objects extracted; (3) a Strangler shim that keeps the old call ` +
          `site working; (4) a bullet list mapping each change to its rule id + authority; ` +
          `(5) the characterization test to write FIRST. Preserve behavior exactly.`,
      );
    },
  );

  // ── generate_characterization_tests ───────────────────────────────────────
  server.registerTool(
    "generate_characterization_tests",
    {
      title: "Scaffold characterization tests",
      description:
        "Return guidance + a PHPUnit skeleton for pinning the CURRENT behavior of legacy code " +
        "before refactoring (Feathers). The safety net that every conversion requires.",
      inputSchema: {
        target: z.string().describe("The function/file/endpoint to characterize, and how it's invoked."),
        observedBehavior: z.string().optional().describe("Known inputs→outputs/side effects, including current bugs to preserve."),
      },
    },
    async ({ target, observedBehavior }) => {
      return text(
        `## Characterization-test the legacy behavior (Feathers)\n` +
          `Goal: pin EXISTING behavior (including current bugs) so refactors are provably safe.\n\n` +
          `### Target\n${target}\n` +
          (observedBehavior ? `\n### Observed behavior to lock in\n${observedBehavior}\n` : "") +
          `\n### Approach\n` +
          `1. Find the coarsest seam you can drive (HTTP/CLI end-to-end, or the function directly).\n` +
          `2. Capture real outputs/side-effects for representative inputs; assert on them verbatim.\n` +
          `3. If hidden deps block testing (db, time, mail), introduce a seam (Parameterize ` +
          `Constructor / Extract Interface) JUST enough to inject a fake — change nothing else.\n` +
          `4. Add edge/error inputs. Run with coverage; consider Infection to prove the test bites.\n\n` +
          `### PHPUnit skeleton\n\`\`\`php\n` +
          `<?php\ndeclare(strict_types=1);\n\nuse PHPUnit\\Framework\\TestCase;\n\n` +
          `final class CharacterizationTest extends TestCase\n{\n` +
          `    /** @dataProvider cases */\n` +
          `    public function testPreservesCurrentBehavior($input, $expected): void\n    {\n` +
          `        // Arrange: build the legacy target with fakes injected at the seam.\n` +
          `        // Act:\n        // \\$actual = subject_under_test(\\$input);\n` +
          `        // Assert CURRENT behavior verbatim (even if it looks wrong):\n` +
          `        // \\$this->assertSame(\\$expected, \\$actual);\n        self::markTestIncomplete('Fill in from observed behavior.');\n    }\n\n` +
          `    public static function cases(): array\n    {\n        return [\n            // [input, expectedOutputCapturedFromLegacy],\n        ];\n    }\n}\n\`\`\``,
      );
    },
  );

  // ── review_conversion ─────────────────────────────────────────────────────
  server.registerTool(
    "review_conversion",
    {
      title: "Review an OOP conversion",
      description:
        "Grade a proposed before→after conversion against the rubric (behavior preserved, DI, " +
        "SRP, DIP, typing, PSR, error handling, no over-engineering, migration safety, naming). " +
        "Returns the rubric + a verify checklist so you can score and ACCEPT/REQUEST CHANGES.",
      inputSchema: {
        before: z.string().optional().describe("Original procedural code."),
        after: z.string().describe("Proposed OOP code."),
        notes: z.string().optional().describe("What the author claims changed and why."),
      },
    },
    async ({ before, after, notes }) => {
      const rubric = readKnowledge("rubric.md");
      const ruleSet = loadRules();
      const residual = scanSource(after, ruleSet.rules);
      const residualText = residual.length
        ? residual.map((h) => `- line ${h.line}: still matches \`${h.ruleId}\` — \`${h.excerpt}\``).join("\n")
        : "- No ruleset smells remain detectable in the converted code. ✅";

      return text(
        (before ? `## Before\n\`\`\`php\n${before}\n\`\`\`\n` : "") +
          `## After\n\`\`\`php\n${after}\n\`\`\`\n` +
          (notes ? `\n## Author notes\n${notes}\n` : "") +
          `\n## Residual smell scan (rules.yaml against the AFTER code)\n${residualText}\n` +
          `\n## Rubric — score each 0–2, enforce minimums\n${rubric}\n` +
          `\n## Deliver\nA scored table, a verdict (ACCEPT / REQUEST CHANGES), and for any failing ` +
          `criterion the SPECIFIC next named refactoring to apply. Also recommend running ` +
          `run_phpstan + run_phpcs on the file to confirm typing/PSR-12, and confirm the ` +
          `characterization tests still pass.`,
      );
    },
  );

  // ── suggest_patterns ──────────────────────────────────────────────────────
  server.registerTool(
    "suggest_patterns",
    {
      title: "Suggest design patterns / OOP moves",
      description:
        "Given a described problem or smell, return the relevant principles and pattern catalog " +
        "(smell→move map, SOLID, GoF/enterprise patterns) to choose from — with the YAGNI guard.",
      inputSchema: {
        problem: z.string().describe("The procedural smell or design problem you're facing."),
      },
    },
    async ({ problem }) => {
      const principles = readKnowledge("principles.md");
      return text(
        `## Problem\n${problem}\n\n## Principle & pattern catalog to choose from\n${principles}\n\n` +
          `## Deliver\nRecommend the SMALLEST design that removes the real coupling/duplication. ` +
          `Justify against the smell→move map and SOLID. Explicitly reject patterns that would be ` +
          `over-engineering here (YAGNI/Rule of Three).`,
      );
    },
  );
}
