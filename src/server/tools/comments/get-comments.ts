import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_get_comments
 * Retrieve footer/inline comments on a page.
 * Cloud: V2 GET /footer-comments?page-id=…
 * Server: V1 GET /content/{id}/child/comment
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_get_comments",
    "Get comments on a Confluence page. Returns comment id, body content, version and URL.",
    {
      page_id: z.string().min(1).describe("Confluence page ID whose comments to retrieve"),
      limit:   z.number().int().min(1).max(100).default(25)
                 .describe("Maximum comments to return (default 25)"),
    },
    async ({ page_id, limit }) => {
      const result = await client.getComments(page_id, limit ?? 25);

      const comments = result.results.map((c) => ({
        id:           c.id,
        title:        c.title ?? "",
        body:         c.body?.storage?.value ?? "",
        version:      c.version?.number,
        last_modified: c.version?.createdAt,
        url:          c._links?.webui ? client.buildUrl(c._links.webui) : null,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ comments, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
