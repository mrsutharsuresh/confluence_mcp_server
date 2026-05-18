import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_get_page
 * Fetch a single page by its numeric ID.
 * Returns title, storage-format body, version, space and URL.
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_get_page",
    "Get a Confluence page by its ID. Returns title, body content (Confluence Storage Format / XHTML), version number, space and URL.",
    {
      page_id: z.string().min(1).describe("Confluence page ID (numeric string, e.g. '12345678')"),
    },
    async ({ page_id }) => {
      const page = await client.getPage(page_id);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id:            page.id,
            title:         page.title,
            type:          page.type,
            status:        page.status,
            version:       page.version?.number,
            last_modified: page.version?.createdAt,
            body:          page.body?.storage?.value ?? "",
            space:         page.space ? page.space.name + " (" + page.space.key + ")" : null,
            url:           client.buildUrl(page._links?.webui),
          }, null, 2),
        }],
      };
    }
  );
}
