import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_get_space
 * Get details for a specific space by key.
 * Cloud: V2 GET /spaces?keys=…   |   Server: V1 GET /space/{key}
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_get_space",
    "Get details for a specific Confluence space by its key. Returns id, name, type, status and description.",
    {
      space_key: z.string().min(1).describe("Confluence space key (e.g. 'MYSPACE')"),
    },
    async ({ space_key }) => {
      const space = await client.getSpace(space_key);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id:          String(space.id),
            key:         space.key,
            name:        space.name,
            type:        space.type,
            status:      space.status,
            description: space.description?.plain?.value ?? "",
            url:         space._links?.webui ? client.confluenceUrl + space._links.webui : null,
          }, null, 2),
        }],
      };
    }
  );
}
