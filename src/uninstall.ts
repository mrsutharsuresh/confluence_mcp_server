import * as fs from "fs";
import * as path from "path";
import * as os from "os";

function log(msg: string): void {
  console.log(`[Uninstall Cleanup] ${msg}`);
}

function cleanupConfigs(): void {
  const homedir = os.homedir();
  const configFiles: string[] = [];

  // Antigravity
  configFiles.push(path.join(homedir, ".gemini", "antigravity", "mcp_config.json"));
  // KIRO
  configFiles.push(path.join(homedir, ".gemini", "kiro", "mcp_config.json"));

  // Cursor
  if (process.platform === "win32") {
    configFiles.push(
      path.join(process.env.APPDATA || "", "Cursor", "User", "globalStorage", "tongshuai.cursor-chat", "mcp_config.json")
    );
  } else if (process.platform === "darwin") {
    configFiles.push(
      path.join(homedir, "Library", "Application Support", "Cursor", "User", "globalStorage", "tongshuai.cursor-chat", "mcp_config.json")
    );
  } else {
    configFiles.push(
      path.join(homedir, ".config", "Cursor", "User", "globalStorage", "tongshuai.cursor-chat", "mcp_config.json")
    );
  }

  // Claude Desktop
  if (process.platform === "win32") {
    configFiles.push(
      path.join(process.env.APPDATA || "", "Claude", "claude_desktop_config.json")
    );
  } else if (process.platform === "darwin") {
    configFiles.push(
      path.join(homedir, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    );
  }

  // Windsurf
  configFiles.push(path.join(homedir, ".codeium", "windsurf", "mcp_config.json"));

  const mcpKey = "confluence-mcp";

  for (const configPath of configFiles) {
    if (!fs.existsSync(configPath)) {
      continue;
    }

    try {
      let data: any = {};
      const fileContent = fs.readFileSync(configPath, "utf8");
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        log(`Skipping invalid JSON file: ${configPath}`);
        continue;
      }

      if (data && data.mcpServers && data.mcpServers[mcpKey]) {
        delete data.mcpServers[mcpKey];
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2), "utf8");
        log(`Successfully removed ${mcpKey} from ${configPath}`);
      }
    } catch (err) {
      console.error(`Error cleaning up config at ${configPath}:`, err);
    }
  }
}

cleanupConfigs();
