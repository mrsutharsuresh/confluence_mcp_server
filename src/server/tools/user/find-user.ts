import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_find_user
 * Search for Confluence users by email or display name.
 * Returns accountId (Cloud) / username (Server) needed for CQL creator/contributor queries.
 * Always uses REST API V1 — /rest/api/user/search
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_find_user",
    "Search for Confluence users by email address or display name. " +
    "Returns accountId (Cloud) or username (Server/DC) which can be used in CQL queries like " +
    "creator = \"<accountId>\" or contributor = \"<accountId>\" to find pages by that person.",
    {
      query: z.string().min(1).describe(
        "Email address or display name to search for, e.g. 'user@company.com' or 'John Smith'"
      ),
    },
    async ({ query }) => {
      const { users, debug } = await client.findUser(query);

      if (!users.length) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              users: [],
              message: `No users found matching: ${query}`,
              debug,
              hint: "If all endpoints return 403, the Atlassian org restricts user search by API. Ask the user to share their profile URL to extract accountId manually.",
            }, null, 2),
          }],
        };
      }

      const results = users.map((u) => ({
        accountId:   u["accountId"]   ?? null,
        username:    u["username"]    ?? null,
        displayName: u["displayName"] ?? null,
        email:       u["email"]       ?? null,
        profileUrl:  u["profileUrl"]  ?? null,
        cqlId:       (u["accountId"] ?? u["username"]) ?? null,
      }));

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            users: results,
            debug,
            tip: "Use the 'cqlId' value in CQL queries: creator = \"<cqlId>\" or contributor = \"<cqlId>\"",
          }, null, 2),
        }],
      };
    }
  );
}
