import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerCqlSearch } from "./cql-search.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerCqlSearch(server, client);
}
