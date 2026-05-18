import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_get_attachments
 * List file attachments on a page.
 * Cloud:  V2 GET /attachments?page-id=…   (fileSize is top-level)
 * Server: V1 GET /content/{id}/child/attachment  (fileSize in extensions.fileSize)
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_get_attachments",
    "List file attachments on a Confluence page. Returns filename, media type, file size and download URL.",
    {
      page_id: z.string().min(1).describe("Confluence page ID whose attachments to list"),
      limit:   z.number().int().min(1).max(100).default(25)
                 .describe("Maximum attachments to return (default 25)"),
    },
    async ({ page_id, limit }) => {
      const result = await client.getAttachments(page_id, limit ?? 25);

      const attachments = result.results.map((a) => ({
        id:        a.id,
        filename:  a.title,
        mediaType: a.mediaType,
        fileSize:  a.fileSize ?? a.extensions?.fileSize ?? null,
        comment:   a.comment ?? "",
        // V2 uses top-level webuiLink/downloadLink; V1 uses _links
        downloadUrl: a.downloadLink
          ?? (a._links?.download ? client.confluenceUrl + a._links.download : null),
        url: a.webuiLink
          ?? (a._links?.webui ? client.confluenceUrl + a._links.webui : null),
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ attachments, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
