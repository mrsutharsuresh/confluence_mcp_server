import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../../confluence-client.js";
import { register as registerGetPage }      from "./get-page.js";
import { register as registerFindPages }    from "./find-pages.js";
import { register as registerCreatePage }   from "./create-page.js";
import { register as registerUpdatePage }   from "./update-page.js";
import { register as registerGetChildren }  from "./get-children.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  registerGetPage(server, client);
  registerFindPages(server, client);
  registerCreatePage(server, client);
  registerUpdatePage(server, client);
  registerGetChildren(server, client);
}
