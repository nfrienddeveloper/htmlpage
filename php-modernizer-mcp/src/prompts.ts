import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

function userPrompt(textBody: string) {
  return {
    messages: [
      { role: "user" as const, content: { type: "text" as const, text: textBody } },
    ],
  };
}

/**
 * Reusable, parameterized workflows the user can invoke directly (they appear as
 * slash-commands in MCP clients). Each prompt orchestrates the tools in the
 * correct, safety-first order.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "modernize-file",
    {
      title: "Modernize a PHP file end-to-end",
      description: "Safety-first workflow to convert one procedural file to OOP.",
      argsSchema: {
        file: z.string().describe("Path to the legacy PHP file."),
        targetPhpVersion: z.string().optional().describe("Target PHP version, e.g. 8.3."),
      },
    },
    ({ file, targetPhpVersion }) =>
      userPrompt(
        `Modernize \`${file}\` to OOP. Follow this exact order and do not skip steps:\n` +
          `1. Call \`assess_codebase\` on this file to enumerate smells.\n` +
          `2. Call \`generate_characterization_tests\` and WRITE the tests; run \`run_phpunit\` — they must pass.\n` +
          `3. Call \`run_rector\` (dry-run) to preview mechanical upgrades; apply if clean.\n` +
          `4. Call \`convert_snippet\` for each smelly unit; implement the OOP design it briefs.\n` +
          `5. Call \`run_phpstan\` and \`run_phpcs\`; fix until clean.\n` +
          `6. Run \`run_phpunit\` again — still green.\n` +
          `7. Call \`review_conversion\` (before vs after) and act on the verdict.\n` +
          `8. Call \`record_feedback\` with the outcome.\n` +
          `Target PHP ${targetPhpVersion ?? "8.3"}. Keep the app runnable; commit one refactoring at a time.`,
      ),
  );

  server.registerPrompt(
    "extract-class",
    {
      title: "Extract a class from procedural functions",
      description: "Apply the Combine-Functions-into-Class recipe to a set of related functions.",
      argsSchema: {
        functions: z.string().describe("The functions/snippet that share data and should become a class."),
      },
    },
    ({ functions }) =>
      userPrompt(
        `Apply the 'Combine Functions into Class' recipe to the following. First call ` +
          `\`get_methodology\` with section=refactorings for the exact recipe, then \`convert_snippet\` ` +
          `for the briefing, then implement. Write the characterization test first.\n\n` +
          `\`\`\`php\n${functions}\n\`\`\``,
      ),
  );

  server.registerPrompt(
    "break-dependencies",
    {
      title: "Break hidden dependencies",
      description: "De-globalize: turn globals/new/statics/superglobals into injected collaborators.",
      argsSchema: {
        snippet: z.string().describe("Code with hidden dependencies (global/new/static/superglobal/date)."),
      },
    },
    ({ snippet }) =>
      userPrompt(
        `Identify every hidden dependency in this code (global, buried \`new\`, static/singleton, ` +
          `superglobal, time/date) and break it via Parameterize Constructor / Extract Interface so ` +
          `it can be tested with doubles. Call \`convert_snippet\` for the rule-grounded briefing, ` +
          `then produce the injected version + the interfaces extracted.\n\n\`\`\`php\n${snippet}\n\`\`\``,
      ),
  );

  server.registerPrompt(
    "plan-strangler-migration",
    {
      title: "Plan a Strangler Fig migration",
      description: "Design an incremental, never-flag-day migration for a large legacy app.",
      argsSchema: {
        description: z.string().describe("The system, its entry points, and the slice you want to migrate first."),
      },
    },
    ({ description }) =>
      userPrompt(
        `Design a Strangler Fig migration. Call \`plan_migration\` with this description, then ` +
          `produce the routing/shim strategy that lets the new OOP path and legacy path coexist, the ` +
          `parity tests, and the order in which to strangle features.\n\n${description}`,
      ),
  );

  server.registerPrompt(
    "train-the-expert",
    {
      title: "Review feedback and improve the ruleset",
      description: "Periodic training loop: turn the feedback log into ruleset/golden-example edits.",
      argsSchema: {},
    },
    () =>
      userPrompt(
        `Run the training loop: call \`get_feedback_summary\`. For each high reject/revise rule, ` +
          `read the relevant knowledge resource, propose a concrete edit to \`rules.yaml\` (tighten ` +
          `\`detect\`, sharpen \`move\`, fix \`authority\`) or add a new golden example under ` +
          `\`knowledge/golden/\`. For each blind-spot rule, suggest how to exercise it. Present the ` +
          `diffs for approval before writing. Then bump the ruleset version and note it in TRAINING.md.`,
      ),
  );
}
