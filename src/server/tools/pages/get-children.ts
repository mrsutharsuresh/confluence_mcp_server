import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_get_page_children
 * List direct child pages of a page.
 * Cloud: V2 GET /pages?parent-id=…
 * Server: V1 GET /content/{id}/child/page
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_get_page_children",
    "Get direct child pages of a Confluence page. Returns list of children with id, title, version and URL.",
    {
      page_id: z.string().min(1).describe("Parent page ID whose children to list"),
      limit:   z.number().int().min(1).max(250).default(25)
                 .describe("Maximum children to return (default 25)"),
    },
    async ({ page_id, limit }) => {
      const result = await client.getPageChildren(page_id, limit ?? 25);

      const children = result.results.map((p) => ({
        id:      p.id,
        title:   p.title,
        status:  p.status,
        version: p.version?.number,
        url:     client.buildUrl(p._links?.webui),
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ children, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
