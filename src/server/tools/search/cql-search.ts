import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_search
 * Search Confluence using CQL (Confluence Query Language).
 * Always uses REST API V1 — V2 has no CQL endpoint.
 *
 * Example CQL queries:
 *   type=page AND space=MYSPACE AND text~"kubernetes"
 *   title="Release Notes" AND space.key=PROJ
 *   creator=currentUser() AND type=blogpost ORDER BY created DESC
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_search",
    "Search Confluence content using CQL (Confluence Query Language). " +
    "Returns matching pages, blog posts and spaces with title, excerpt, space and URL. " +
    "Example CQL: 'type=page AND space=MYSPACE AND text~\"kubernetes\"'",
    {
      cql:   z.string().min(1).describe("CQL query string, e.g. 'type=page AND text~\"kubernetes\"'"),
      limit: z.number().int().min(1).max(100).default(25)
               .describe("Maximum results to return (default 25, max 100)"),
    },
    async ({ cql, limit }) => {
      let result;
      try {
        result = await client.search(cql, limit ?? 25);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const hint = msg.includes("400")
          ? " Hint: CQL date values must be quoted, e.g. lastModified >= \"-7d\" not lastModified>=-7d. ORDER BY field names are lowercase, e.g. ORDER BY lastmodified DESC."
          : "";
        throw new Error(msg + hint);
      }

      const items = result.results.map((item) => ({
        id:            item.id,
        title:         item.title,
        type:          item.type,
        space:         item.space ? item.space.name + " (" + item.space.key + ")" : null,
        excerpt:       item.excerpt ?? "",
        url:           item._links?.webui ? client.buildUrl(item._links.webui) : null,
        last_modified: item.lastModified ?? null,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ results: items, total: result.totalSize }, null, 2),
        }],
      };
    }
  );
}
