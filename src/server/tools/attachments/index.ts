import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerGetAttachments } from "./get-attachments.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerGetAttachments(server, client);
}
