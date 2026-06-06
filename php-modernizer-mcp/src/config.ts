import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Repo root (one level up from dist/ or src/). */
export const PACKAGE_ROOT = resolve(__dirname, "..");

/**
 * Central configuration. Everything is overridable by environment variable so
 * the same server binary works across machines and PHP projects.
 */
export const config = {
  /** Directory holding the editable knowledge base ("the brain"). */
  knowledgeDir: process.env.PHP_MODERNIZER_KNOWLEDGE_DIR
    ? resolve(process.env.PHP_MODERNIZER_KNOWLEDGE_DIR)
    : resolve(PACKAGE_ROOT, "knowledge"),

  /** Append-only learning log. */
  feedbackFile: process.env.PHP_MODERNIZER_FEEDBACK_FILE
    ? resolve(process.env.PHP_MODERNIZER_FEEDBACK_FILE)
    : resolve(PACKAGE_ROOT, "feedback", "feedback.jsonl"),

  /** The PHP project being modernized (where vendor/bin lives). */
  projectDir: process.env.PHP_MODERNIZER_PROJECT_DIR
    ? resolve(process.env.PHP_MODERNIZER_PROJECT_DIR)
    : process.cwd(),

  /** Explicit binary overrides; otherwise discovered under vendor/bin then PATH. */
  bins: {
    rector: process.env.PHP_MODERNIZER_RECTOR_BIN,
    phpstan: process.env.PHP_MODERNIZER_PHPSTAN_BIN,
    psalm: process.env.PHP_MODERNIZER_PSALM_BIN,
    phpcs: process.env.PHP_MODERNIZER_PHPCS_BIN,
    "php-cs-fixer": process.env.PHP_MODERNIZER_PHP_CS_FIXER_BIN,
    phpunit: process.env.PHP_MODERNIZER_PHPUNIT_BIN,
    composer: process.env.PHP_MODERNIZER_COMPOSER_BIN,
  } as Record<string, string | undefined>,

  /** Max wall-clock for any shelled PHP tool (ms). */
  toolTimeoutMs: Number(process.env.PHP_MODERNIZER_TOOL_TIMEOUT_MS ?? 120_000),

  /** Allow the integration tools to actually run external processes. */
  allowExec: process.env.PHP_MODERNIZER_ALLOW_EXEC !== "false",
} as const;
