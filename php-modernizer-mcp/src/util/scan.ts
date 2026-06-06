import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";
import type { Rule } from "../knowledge.js";

export interface SmellHit {
  ruleId: string;
  severity: string;
  line: number;
  excerpt: string;
}

export interface FileReport {
  file: string;
  hits: SmellHit[];
}

const SKIP_DIRS = new Set(["vendor", "node_modules", ".git", "dist", "build", "var", "cache"]);

/** Recursively collect .php files under root, skipping vendor/etc. */
export function collectPhpFiles(root: string, limit = 2000): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    if (out.length >= limit) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= limit) return;
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) walk(join(dir, e.name));
      } else if (extname(e.name).toLowerCase() === ".php") {
        out.push(join(dir, e.name));
      }
    }
  };
  if (existsSync(root) && statSync(root).isDirectory()) walk(root);
  else if (existsSync(root)) out.push(root);
  return out;
}

/** Apply a ruleset's detect regexes to one source string. */
export function scanSource(source: string, rules: Rule[]): SmellHit[] {
  const lines = source.split("\n");
  const hits: SmellHit[] = [];
  for (const rule of rules) {
    let re: RegExp;
    try {
      re = new RegExp(rule.detect, "i");
    } catch {
      continue; // skip invalid regex rather than crash
    }
    lines.forEach((line, i) => {
      if (re.test(line)) {
        hits.push({
          ruleId: rule.id,
          severity: rule.severity ?? "medium",
          line: i + 1,
          excerpt: line.trim().slice(0, 160),
        });
      }
    });
  }
  return hits;
}

/** Scan a tree of PHP files and report per-file smell hits. */
export function scanTree(root: string, rules: Rule[], limit = 2000): FileReport[] {
  return collectPhpFiles(root, limit)
    .map((file) => {
      let src = "";
      try {
        src = readFileSync(file, "utf8");
      } catch {
        return { file, hits: [] };
      }
      return { file: relative(root, file) || file, hits: scanSource(src, rules) };
    })
    .filter((r) => r.hits.length > 0);
}
