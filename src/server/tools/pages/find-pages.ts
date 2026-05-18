import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_find_pages
 * List pages in a space, with optional title filter.
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_find_pages",
    "Find pages in a Confluence space. Optionally filter by title. Returns a list of pages with id, title, version and URL.",
    {
      space_key: z.string().min(1).describe("Confluence space key (e.g. 'MYSPACE')"),
      title:     z.string().optional().describe("Optional: filter by exact page title"),
      limit:     z.number().int().min(1).max(250).default(25)
                   .describe("Maximum pages to return (default 25)"),
    },
    async ({ space_key, title, limit }) => {
      const result = await client.findPages(space_key, title, limit ?? 25);

      const pages = result.results.map((p) => ({
        id:      p.id,
        title:   p.title,
        status:  p.status,
        version: p.version?.number,
        space:   p.space ? p.space.name + " (" + p.space.key + ")" : null,
        url:     client.buildUrl(p._links?.webui),
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ pages, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
