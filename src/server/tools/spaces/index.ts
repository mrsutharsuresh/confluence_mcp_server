import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerListSpaces } from "./list-spaces.js";
import { register as registerGetSpace }   from "./get-space.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerListSpaces(server, client);
  registerGetSpace(server, client);
}
