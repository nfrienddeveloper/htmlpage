import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerKnowledgeTools } from "./tools/knowledgeTools.js";
import { registerIntegrationTools } from "./tools/integrationTools.js";
import { registerFeedbackTools } from "./tools/feedbackTools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

/**
 * Build the PHP Modernizer MCP server with all tools, resources, and prompts.
 * Kept transport-agnostic so it can be served over stdio (default) or wired to
 * an HTTP transport later.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "php-modernizer-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
      },
      instructions:
        "Expert at modernizing legacy procedural PHP into clean, tested, PSR-compliant OOP. " +
        "ALWAYS work safety-net-first: characterization tests before any change, keep the app " +
        "runnable, one named refactoring per commit, behavior-preserving. Ground every plan and " +
        "conversion in the knowledge base (Paul M. Jones's Modernizing Legacy Applications in PHP, " +
        "Feathers, Fowler, SOLID, PHP-FIG/PSR). Automate mechanical upgrades with Rector and verify " +
        "with PHPStan/PHP-CS-Fixer/PHPUnit; reserve human/LLM judgment for design. Record outcomes " +
        "with record_feedback so the ruleset improves over time.",
    },
  );

  registerKnowledgeTools(server);
  registerIntegrationTools(server);
  registerFeedbackTools(server);
  registerResources(server);
  registerPrompts(server);

  return server;
}
