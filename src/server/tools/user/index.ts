import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerWhoami }   from "./whoami.js";
import { register as registerFindUser } from "./find-user.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerWhoami(server, client);
  registerFindUser(server, client);
}
