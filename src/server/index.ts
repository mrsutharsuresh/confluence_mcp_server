import { McpServer }          from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfluenceClient }     from "./confluence-client.js";
import { registerAllTools }     from "./tools/index.js";

function getRequiredEnv(name: string): string {
  const val = process.env[name]?.trim();
  if (!val) {
    process.stderr.write(
      `[confluence-mcp] ERROR: Required environment variable '${name}' is not set.\n` +
      `Run 'Confluence MCP: Configure Confluence Connection' in VS Code to set up your credentials.\n`
    );
    process.exit(1);
  }
  return val;
}

async function main(): Promise<void> {
  const confluenceUrl  = getRequiredEnv("CONFLUENCE_URL");
  const token          = getRequiredEnv("CONFLUENCE_TOKEN");
  const username       = process.env["CONFLUENCE_USERNAME"]?.trim()      ?? "";
  const authMode       = process.env["CONFLUENCE_AUTH_MODE"]?.trim()     ?? "bearer";
  const instanceType   = process.env["CONFLUENCE_INSTANCE_TYPE"]?.trim() ?? "cloud";

  const client = new ConfluenceClient(confluenceUrl, token, username, authMode, instanceType);
  const server = new McpServer({ name: "confluence-mcp", version: "1.0.0" });

  const toolCount = registerAllTools(server, client);

  process.stderr.write(
    `[confluence-mcp] Server started — ${toolCount} tools registered — ${confluenceUrl} (${instanceType})\n`
  );

  await server.connect(new StdioServerTransport());
}

main().catch((err: unknown) => {
  process.stderr.write(
    "[confluence-mcp] Fatal error: " +
    (err instanceof Error ? err.message : String(err)) + "\n"
  );
  process.exit(1);
});
