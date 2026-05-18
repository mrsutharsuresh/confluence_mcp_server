import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_update_page
 * Update an existing page's title and/or body.
 * Requires the current version number (optimistic lock).
 * Use confluence_get_page first to retrieve the current version.
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_update_page",
    "Update an existing Confluence page's title and body. " +
    "Requires the current version number — use confluence_get_page to fetch it first. " +
    "Body must be in Confluence Storage Format (XHTML).",
    {
      page_id:         z.string().min(1).describe("Confluence page ID to update"),
      title:           z.string().min(1).describe("New page title"),
      body:            z.string().min(1).describe("New page body in Confluence Storage Format (XHTML)"),
      current_version: z.number().int().min(1)
                         .describe("Current version number of the page (for optimistic locking)"),
    },
    async ({ page_id, title, body, current_version }) => {
      const page = await client.updatePage(page_id, title, body, current_version);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id:      page.id,
            title:   page.title,
            version: page.version?.number,
            url:     page._links?.webui ? client.confluenceUrl + page._links.webui : null,
            status:  "updated",
          }, null, 2),
        }],
      };
    }
  );
}
