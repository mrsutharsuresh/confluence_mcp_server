import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_create_page
 * Create a new page in a space.
 * Body must be Confluence Storage Format (XHTML).
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_create_page",
    "Create a new Confluence page in a space. " +
    "Body must be in Confluence Storage Format (XHTML). " +
    "Example body: '<p>Hello <strong>World</strong></p>'. " +
    "Returns the created page ID, title, version and URL.",
    {
      space_key: z.string().min(1).describe("Space key where the page will be created (e.g. 'MYSPACE')"),
      title:     z.string().min(1).describe("Title of the new page"),
      body:      z.string().min(1).describe("Page content in Confluence Storage Format (XHTML)"),
      parent_id: z.string().optional().describe("Optional parent page ID to nest this page under"),
    },
    async ({ space_key, title, body, parent_id }) => {
      const page = await client.createPage(space_key, title, body, parent_id);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id:      page.id,
            title:   page.title,
            version: page.version?.number,
            url:     page._links?.webui ? client.confluenceUrl + page._links.webui : null,
            status:  "created",
          }, null, 2),
        }],
      };
    }
  );
}
