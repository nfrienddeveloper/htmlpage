import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import { listKnowledge } from "./knowledge.js";

const SCHEME = "php-modernizer";

function mimeFor(path: string): string {
  if (/\.ya?ml$/i.test(path)) return "application/yaml";
  if (/\.md$/i.test(path)) return "text/markdown";
  return "text/plain";
}

/**
 * Expose the entire knowledge base as readable MCP resources at
 * php-modernizer://knowledge/<relative-path>. Clients can browse and read the
 * methodology, PSR cheat sheet, ruleset, golden examples, etc.
 */
export function registerResources(server: McpServer): void {
  server.registerResource(
    "knowledge",
    new ResourceTemplate(`${SCHEME}://knowledge/{+path}`, {
      list: async () => ({
        resources: listKnowledge().map((rel) => ({
          uri: `${SCHEME}://knowledge/${rel}`,
          name: rel,
          description: `Knowledge base document: ${rel}`,
          mimeType: mimeFor(rel),
        })),
      }),
    }),
    {
      title: "PHP modernization knowledge base",
      description:
        "The editable expertise the server reasons from: methodology, principles, PSR cheat sheet, " +
        "refactoring catalog, tooling guide, ruleset, golden examples, and review rubric.",
    },
    async (uri, variables) => {
      const rel = Array.isArray(variables.path) ? variables.path.join("/") : String(variables.path);
      const full = resolve(config.knowledgeDir, rel);
      // Guard against path traversal outside the knowledge dir.
      if (!full.startsWith(resolve(config.knowledgeDir))) {
        throw new Error(`Refusing to read outside knowledge dir: ${rel}`);
      }
      const textBody = readFileSync(full, "utf8");
      return {
        contents: [{ uri: uri.href, mimeType: mimeFor(rel), text: textBody }],
      };
    },
  );
}
