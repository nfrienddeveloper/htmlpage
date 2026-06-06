import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { recordFeedback, readFeedback, loadRules } from "../knowledge.js";

function text(s: string) {
  return { content: [{ type: "text" as const, text: s }] };
}

export function registerFeedbackTools(server: McpServer): void {
  // ── record_feedback ───────────────────────────────────────────────────────
  server.registerTool(
    "record_feedback",
    {
      title: "Record conversion feedback (train the expert)",
      description:
        "Append an outcome to the learning log: was a suggested conversion accepted, rejected, or " +
        "revised, and why. This is how the expert improves — over time the log reveals which rules " +
        "to refine, which golden examples to add, and which moves the team prefers.",
      inputSchema: {
        outcome: z.enum(["accepted", "rejected", "revised"]).describe("How the suggestion fared in review."),
        ruleId: z.string().optional().describe("The rules.yaml rule this concerned, if any."),
        snippetSummary: z.string().optional().describe("Short description of the code involved."),
        notes: z.string().optional().describe("Why — especially for rejected/revised, so the ruleset can be tuned."),
        reviewer: z.string().optional().describe("Who reviewed (optional)."),
      },
    },
    async ({ outcome, ruleId, snippetSummary, notes, reviewer }) => {
      recordFeedback({
        ts: new Date().toISOString(),
        outcome,
        ruleId,
        snippetSummary,
        notes,
        reviewer,
      });
      return text(
        `Recorded **${outcome}**${ruleId ? ` for rule \`${ruleId}\`` : ""}. ` +
          `Review trends with \`get_feedback_summary\`; act on them by editing rules.yaml / golden examples (see TRAINING.md).`,
      );
    },
  );

  // ── get_feedback_summary ──────────────────────────────────────────────────
  server.registerTool(
    "get_feedback_summary",
    {
      title: "Summarize the learning log",
      description:
        "Aggregate the feedback log into accept/reject/revise rates overall and per rule, and " +
        "surface rules that are frequently rejected/revised (candidates for refinement) plus " +
        "rules with no feedback yet. Use this to decide what to 'train' next.",
      inputSchema: {
        recentNotes: z.number().int().min(0).max(100).optional().describe("How many recent note entries to include. Default 10."),
      },
    },
    async ({ recentNotes }) => {
      const entries = readFeedback();
      if (entries.length === 0) {
        return text("No feedback recorded yet. Use `record_feedback` after reviews to start training the expert.");
      }

      const counts = { accepted: 0, rejected: 0, revised: 0 } as Record<string, number>;
      const perRule = new Map<string, { accepted: number; rejected: number; revised: number }>();
      for (const e of entries) {
        counts[e.outcome] = (counts[e.outcome] ?? 0) + 1;
        const key = e.ruleId ?? "(unattributed)";
        const r = perRule.get(key) ?? { accepted: 0, rejected: 0, revised: 0 };
        r[e.outcome]++;
        perRule.set(key, r);
      }

      const total = entries.length;
      const perRuleLines = [...perRule.entries()]
        .map(([id, r]) => {
          const bad = r.rejected + r.revised;
          return { id, ...r, bad, sum: r.accepted + bad };
        })
        .sort((a, b) => b.bad - a.bad)
        .map((r) => `| ${r.id} | ${r.accepted} | ${r.rejected} | ${r.revised} |`)
        .join("\n");

      // Rules with zero feedback → blind spots.
      const allRuleIds = loadRules().rules.map((r) => r.id);
      const seen = new Set(entries.map((e) => e.ruleId).filter(Boolean) as string[]);
      const untested = allRuleIds.filter((id) => !seen.has(id));

      const notesN = recentNotes ?? 10;
      const recent = entries
        .filter((e) => e.notes)
        .slice(-notesN)
        .map((e) => `- [${e.outcome}${e.ruleId ? `/${e.ruleId}` : ""}] ${e.notes}`)
        .join("\n");

      return text(
        `# Feedback summary (${total} entries)\n\n` +
          `Overall — accepted: ${counts.accepted}, rejected: ${counts.rejected}, revised: ${counts.revised}\n\n` +
          `## Per-rule outcomes (most-contested first)\n| rule | accepted | rejected | revised |\n|---|---|---|---|\n${perRuleLines}\n\n` +
          `## Rules to refine\nHigh reject+revise rules above are the top candidates for editing in rules.yaml or for a new golden example.\n\n` +
          `## Blind spots (rules with no feedback yet)\n${untested.length ? untested.map((id) => `- ${id}`).join("\n") : "- none"}\n\n` +
          `## Recent notes\n${recent || "- (no notes recorded)"}`,
      );
    },
  );
}
