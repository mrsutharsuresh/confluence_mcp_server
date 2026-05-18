import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerGetComments } from "./get-comments.js";
import { register as registerAddComment }  from "./add-comment.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerGetComments(server, client);
  registerAddComment(server, client);
}
