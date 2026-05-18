import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_list_spaces
 * List available Confluence spaces.
 * Cloud: V2 GET /spaces   |   Server: V1 GET /space
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_list_spaces",
    "List Confluence spaces. Returns space key, name, type, status and URL.",
    {
      limit: z.number().int().min(1).max(500).default(25)
               .describe("Maximum spaces to return (default 25)"),
      type:  z.enum(["global", "personal"]).optional()
               .describe("Filter by space type: 'global' or 'personal'"),
    },
    async ({ limit, type }) => {
      const result = await client.listSpaces(limit ?? 25, type);

      const spaces = result.results.map((s) => ({
        id:          String(s.id),
        key:         s.key,
        name:        s.name,
        type:        s.type,
        status:      s.status,
        description: s.description?.plain?.value ?? "",
        url:         s._links?.webui ? client.confluenceUrl + s._links.webui : null,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ spaces, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
