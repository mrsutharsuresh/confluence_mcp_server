import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_add_comment
 * Add a footer comment to a page.
 * Cloud: V2 POST /footer-comments
 * Server: V1 POST /content  (type=comment, container={id, type:"page"})
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_add_comment",
    "Add a footer comment to a Confluence page. " +
    "Body must be in Confluence Storage Format (XHTML). " +
    "Example: '<p>This looks good!</p>'",
    {
      page_id: z.string().min(1).describe("Confluence page ID to comment on"),
      body:    z.string().min(1).describe("Comment body in Confluence Storage Format (XHTML)"),
    },
    async ({ page_id, body }) => {
      const comment = await client.addComment(page_id, body);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            id:     comment.id,
            body:   comment.body?.storage?.value ?? body,
            url:    comment._links?.webui ? client.confluenceUrl + comment._links.webui : null,
            status: "created",
          }, null, 2),
        }],
      };
    }
  );
}
