import { readFileSync, readdirSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { parse as parseYaml } from "yaml";
import { config } from "./config.js";

export interface Rule {
  id: string;
  smell: string;
  detect: string;
  move: string;
  principle?: string[];
  authority?: string;
  tooling?: string[];
  severity?: "low" | "medium" | "high";
}

export interface RuleSet {
  version: number;
  meta?: Record<string, unknown>;
  rules: Rule[];
}

/** Read a knowledge file by name (e.g. "methodology.md"). Throws if missing. */
export function readKnowledge(name: string): string {
  const path = resolve(config.knowledgeDir, name);
  if (!existsSync(path)) {
    throw new Error(`Knowledge file not found: ${name} (looked in ${config.knowledgeDir})`);
  }
  return readFileSync(path, "utf8");
}

/** List every knowledge document (markdown + yaml) as relative paths. */
export function listKnowledge(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.(md|ya?ml)$/i.test(entry.name)) out.push(relative(config.knowledgeDir, p));
    }
  };
  walk(config.knowledgeDir);
  return out.sort();
}

/** Load and validate the conversion ruleset. */
export function loadRules(): RuleSet {
  const raw = readKnowledge("rules.yaml");
  const parsed = parseYaml(raw) as RuleSet;
  if (!parsed?.rules || !Array.isArray(parsed.rules)) {
    throw new Error("rules.yaml is malformed: missing top-level `rules` array.");
  }
  return parsed;
}

/** Load golden before/after examples. */
export function loadGoldenExamples(): { name: string; content: string }[] {
  const dir = resolve(config.knowledgeDir, "golden");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.md$/i.test(f))
    .map((f) => ({ name: f, content: readFileSync(join(dir, f), "utf8") }));
}

export interface FeedbackEntry {
  ts: string;
  outcome: "accepted" | "rejected" | "revised";
  ruleId?: string;
  snippetSummary?: string;
  notes?: string;
  reviewer?: string;
}

/** Append one feedback record to the JSONL learning log. */
export function recordFeedback(entry: FeedbackEntry): void {
  const dir = resolve(config.feedbackFile, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  appendFileSync(config.feedbackFile, JSON.stringify(entry) + "\n", "utf8");
}

/** Read all feedback entries (best-effort; skips malformed lines). */
export function readFeedback(): FeedbackEntry[] {
  if (!existsSync(config.feedbackFile)) return [];
  return readFileSync(config.feedbackFile, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as FeedbackEntry;
      } catch {
        return null;
      }
    })
    .filter((x): x is FeedbackEntry => x !== null);
}
