import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z }           from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

/**
 * confluence_whoami
 * Return the currently authenticated user's profile.
 * Always uses REST API V1 — no equivalent in V2.
 *
 * Cloud returns:  { type, accountId, displayName, email, ... }
 * Server returns: { type, username, displayName, userKey, ... }
 */
export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_whoami",
    "Return the currently authenticated Confluence user's profile. " +
    "Useful to verify credentials and check which account is active.",
    {},   // no parameters — uses the configured credentials
    async (_args: Record<string, never>) => {
      const user = await client.whoami();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            type:        user["type"],
            accountId:   user["accountId"],   // Cloud
            username:    user["username"],     // Server/DC
            displayName: user["displayName"],
            email:       user["email"],
            profileUrl:  user["profilePicture"]
              ? client.confluenceUrl + "/users/" + (user["accountId"] ?? user["username"])
              : null,
          }, null, 2),
        }],
      };
    }
  );
}
