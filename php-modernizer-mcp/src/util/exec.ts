import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "../config.js";

export interface ExecResult {
  ok: boolean;
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Resolve a PHP tool binary: explicit override → <projectDir>/vendor/bin/<tool>
 * → bare name on PATH. Returns null only when not found locally (PATH lookup is
 * deferred to spawn).
 */
export function resolveBinary(tool: string): string {
  const override = config.bins[tool];
  if (override && existsSync(override)) return override;

  const vendorBin = resolve(config.projectDir, "vendor", "bin", tool);
  if (existsSync(vendorBin)) return vendorBin;

  // Fall back to PATH lookup at spawn time.
  return tool;
}

/** Run a command safely (no shell), capped by a timeout, capturing output. */
export function run(
  command: string,
  args: string[],
  opts: { cwd?: string } = {},
): Promise<ExecResult> {
  const full = `${command} ${args.join(" ")}`.trim();

  if (!config.allowExec) {
    return Promise.resolve({
      ok: false,
      command: full,
      exitCode: null,
      stdout: "",
      stderr: "",
      error:
        "Execution disabled (PHP_MODERNIZER_ALLOW_EXEC=false). This is an advisory-only response.",
    });
  }

  return new Promise((resolvePromise) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const child = spawn(command, args, {
      cwd: opts.cwd ?? config.projectDir,
      shell: false,
      env: process.env,
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      resolvePromise({
        ok: false,
        command: full,
        exitCode: null,
        stdout,
        stderr,
        error: `Timed out after ${config.toolTimeoutMs}ms`,
      });
    }, config.toolTimeoutMs);

    child.stdout?.on("data", (d) => (stdout += d.toString()));
    child.stderr?.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({
        ok: false,
        command: full,
        exitCode: null,
        stdout,
        stderr,
        error: `Failed to start "${command}": ${err.message}. Is the tool installed (composer require --dev) and is PHP_MODERNIZER_PROJECT_DIR correct?`,
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({
        ok: code === 0,
        command: full,
        exitCode: code,
        stdout,
        stderr,
      });
    });
  });
}

/** Render an ExecResult as readable text for an MCP tool response. */
export function formatExec(label: string, r: ExecResult): string {
  const head = `$ ${r.command}\n`;
  if (r.error) {
    return `### ${label}\n${head}\n⚠️  ${r.error}`;
  }
  const status = r.ok ? "✅ exit 0" : `❌ exit ${r.exitCode}`;
  const body = [r.stdout.trim(), r.stderr.trim()].filter(Boolean).join("\n--- stderr ---\n");
  return `### ${label} (${status})\n${head}\n${body || "(no output)"}`;
}
