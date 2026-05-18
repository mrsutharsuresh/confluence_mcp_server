import { McpServer }       from "@modelcontextprotocol/sdk/server/mcp.js";
import { ConfluenceClient } from "../confluence-client.js";

import { register as registerSearch }      from "./search/index.js";
import { register as registerPages }       from "./pages/index.js";
import { register as registerSpaces }      from "./spaces/index.js";
import { register as registerComments }    from "./comments/index.js";
import { register as registerAttachments } from "./attachments/index.js";
import { register as registerUser }        from "./user/index.js";

export function registerAllTools(server: McpServer, client: ConfluenceClient): number {
  registerSearch(server, client);      // 1
  registerPages(server, client);       // 5
  registerSpaces(server, client);      // 2
  registerComments(server, client);    // 2
  registerAttachments(server, client); // 1
  registerUser(server, client);        // 2 (whoami + find_user)
  return 13; // total tools registered
}
