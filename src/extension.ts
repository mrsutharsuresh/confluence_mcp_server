import * as vscode from "vscode";
import axios, { type AxiosRequestConfig } from "axios";

const SECRET_KEY = "confluence-copilot-mcp.pat";
const CFG        = "confluence-copilot-mcp";
const DISPLAY    = "Confluence MCP";

let out: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;
let mcpChangeEmitter: vscode.EventEmitter<void>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string): void {
  out?.appendLine(`[${new Date().toISOString()}] ${msg}`);
}

function logError(label: string, err: unknown): void {
  log(`ERROR: ${label}`);
  if (axios.isAxiosError(err)) {
    log(`  axios code    : ${err.code ?? "(none)"}`);
    log(`  message       : ${err.message}`);
    log(`  status        : ${err.response?.status ?? "no response"}`);
    log(`  url           : ${err.config?.url ?? "?"}`);
    log(`  proxy cfg     : ${JSON.stringify((err.config as AxiosRequestConfig & { proxy?: unknown })?.proxy ?? null)}`);
    if (err.response?.data) {
      log(`  response body : ${JSON.stringify(err.response.data).slice(0, 500)}`);
    }
  } else if (err instanceof Error) {
    log(`  ${err.stack ?? err.message}`);
  } else {
    log(`  ${String(err)}`);
  }
}

function cfg<T>(key: string): T | undefined {
  return vscode.workspace.getConfiguration(CFG).get<T>(key);
}

function buildAuthHeader(pat: string, username: string, authMode: string): string {
  if (authMode === "basic") {
    return "Basic " + Buffer.from(username + ":" + pat).toString("base64");
  }
  return "Bearer " + pat;
}

// ─── Connection Test ──────────────────────────────────────────────────────────

async function testConnection(
  url: string,
  pat: string,
  username: string,
  authMode: string
): Promise<void> {
  const baseUrl = url.replace(/\/+$/, "");
  const res = await axios.get(baseUrl + "/rest/api/user/current", {
    headers: { Authorization: buildAuthHeader(pat, username, authMode), Accept: "application/json" },
    timeout: 12_000,
    validateStatus: (s) => s < 500,
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`Authentication failed (HTTP ${res.status}). Verify credentials.`);
  }
  if (res.status !== 200) {
    throw new Error(`Unexpected HTTP ${res.status} — verify the Confluence URL.`);
  }
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────

async function runConfigure(context: vscode.ExtensionContext): Promise<void> {
  const pat = await context.secrets.get(SECRET_KEY);
  const url = cfg<string>("confluenceUrl");

  // If already configured, offer targeted actions
  if (pat && url) {
    const choice = await vscode.window.showQuickPick(
      [
        { label: "$(check) Test Connection",   description: "Verify current credentials are working" },
        { label: "$(key) Update Token",        description: "Replace your PAT or API token" },
        { label: "$(link) Update Server URL",  description: url },
        { label: "$(pencil) Reconfigure All",  description: "Re-enter all settings" },
      ],
      { title: `${DISPLAY}: Already Configured`, placeHolder: "What would you like to do?", ignoreFocusOut: true }
    );
    if (!choice) return;
    if (choice.label.includes("Test Connection")) { await runTestConnection(context); return; }
    if (!choice.label.includes("Reconfigure All")) {
      // For targeted updates, fall through to the full wizard (pre-filled)
      if (choice.label.includes("Update Token")) {
        await promptForToken(context, url);
        return;
      }
    }
  }

  // Full wizard
  await promptForAll(context);
}

async function promptForAll(context: vscode.ExtensionContext): Promise<void> {
  // 1. Base URL
  const url = await vscode.window.showInputBox({
    title: `${DISPLAY} — Base URL`,
    prompt: "e.g. https://yourco.atlassian.net/wiki  or  https://confluence.internal.com",
    value: cfg<string>("confluenceUrl") ?? "",
    ignoreFocusOut: true,
    validateInput: (v) => v.trim() ? undefined : "URL is required",
  });
  if (!url?.trim()) return;

  // 2. Instance type
  const instancePick = await vscode.window.showQuickPick(
    [
      { label: "$(cloud) Cloud (atlassian.net)",  description: "REST API v2 primary",  value: "cloud"  },
      { label: "$(server) Server / Data Center",  description: "REST API v1 only",     value: "server" },
    ],
    { title: `${DISPLAY} — Instance Type`, ignoreFocusOut: true }
  );
  if (!instancePick) return;

  // 3. Auth mode
  const authPick = await vscode.window.showQuickPick(
    [
      { label: "Basic Auth  (email + API token)", description: "Cloud — token from id.atlassian.com", value: "basic"  },
      { label: "Bearer Token (PAT)",              description: "Server / DC Personal Access Token",  value: "bearer" },
    ],
    { title: `${DISPLAY} — Authentication Mode`, ignoreFocusOut: true }
  );
  if (!authPick) return;

  // 4. Username (basic only)
  let username = "";
  if (authPick.value === "basic") {
    const u = await vscode.window.showInputBox({
      title: `${DISPLAY} — Email`,
      prompt: "Your Atlassian account email (used as username for basic auth)",
      value: cfg<string>("username") ?? "",
      ignoreFocusOut: true,
    });
    if (!u?.trim()) return;
    username = u.trim();
  }

  // 5. PAT / API token
  await promptForToken(context, url.trim(), instancePick.value, authPick.value, username);
}

async function promptForToken(
  context: vscode.ExtensionContext,
  url: string,
  instanceType?: string,
  authMode?: string,
  username?: string
): Promise<void> {
  const resolvedAuth = authMode ?? cfg<string>("authMode") ?? "bearer";
  const tokenLabel   = resolvedAuth === "basic" ? "Atlassian API Token" : "Personal Access Token (PAT)";

  const pat = await vscode.window.showInputBox({
    title: `${DISPLAY} — ${tokenLabel}`,
    prompt: `Enter your ${tokenLabel}. Stored securely in VS Code Secret Storage.`,
    password: true,
    ignoreFocusOut: true,
  });
  if (!pat?.trim()) return;

  // Test before saving
  const resolvedUser = username ?? cfg<string>("username") ?? "";
  const testErr = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `${DISPLAY}: Testing connection…` },
    async () => {
      try {
        await testConnection(url, pat.trim(), resolvedUser, resolvedAuth);
        return null;
      } catch (err: unknown) {
        return err instanceof Error ? err.message : String(err);
      }
    }
  );

  if (testErr) {
    const choice = await vscode.window.showErrorMessage(
      `Connection failed: ${testErr}`,
      "Save Anyway",
      "Cancel"
    );
    if (choice !== "Save Anyway") return;
  } else {
    void vscode.window.showInformationMessage(`✅ ${DISPLAY}: Connection verified!`);
  }

  // Persist settings
  const config = vscode.workspace.getConfiguration(CFG);
  await config.update("confluenceUrl", url, vscode.ConfigurationTarget.Global);
  if (instanceType) await config.update("instanceType", instanceType, vscode.ConfigurationTarget.Global);
  if (authMode)     await config.update("authMode",     authMode,     vscode.ConfigurationTarget.Global);
  if (username)     await config.update("username",     username,     vscode.ConfigurationTarget.Global);
  await context.secrets.store(SECRET_KEY, pat.trim());

  log(`Credentials saved — ${url} (${instanceType ?? cfg("instanceType")}, ${resolvedAuth})`);
  mcpChangeEmitter.fire();
  await updateStatusBar(context, true);
}

async function runClearCredentials(context: vscode.ExtensionContext): Promise<void> {
  await context.secrets.delete(SECRET_KEY);
  log("Credentials cleared.");
  mcpChangeEmitter.fire();
  await updateStatusBar(context, false);
  void vscode.window.showInformationMessage(`${DISPLAY}: Credentials cleared.`);
}

async function runTestConnection(context: vscode.ExtensionContext): Promise<void> {
  const pat = await context.secrets.get(SECRET_KEY);
  const url = cfg<string>("confluenceUrl");
  if (!pat || !url) {
    void vscode.window.showWarningMessage(
      `${DISPLAY}: No credentials configured. Run '${DISPLAY}: Configure Confluence Connection' first.`
    );
    return;
  }
  try {
    await testConnection(url, pat, cfg<string>("username") ?? "", cfg<string>("authMode") ?? "bearer");
    void vscode.window.showInformationMessage(`✅ ${DISPLAY}: Connection is working!`);
    await updateStatusBar(context, true);
  } catch (err: unknown) {
    logError("testConnection", err);
    void vscode.window.showErrorMessage(
      `${DISPLAY}: Connection failed — ` + (err instanceof Error ? err.message : String(err))
    );
    await updateStatusBar(context, false);
  }
}

/**
 * Called by VS Code via ${command:confluence-copilot-mcp.getToken} to inject
 * the token as an environment variable into the MCP server subprocess.
 */
async function getToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const pat = await context.secrets.get(SECRET_KEY);
  if (!pat) {
    vscode.window
      .showWarningMessage(
        `${DISPLAY}: No token configured. Run '${DISPLAY}: Configure Confluence Connection'.`,
        "Configure Now"
      )
      .then((action) => { if (action === "Configure Now") runConfigure(context); });
    return undefined;
  }
  return pat;
}

// ─── Status Bar ───────────────────────────────────────────────────────────────

async function updateStatusBar(
  context: vscode.ExtensionContext,
  forceConnected?: boolean
): Promise<void> {
  const pat = await context.secrets.get(SECRET_KEY);
  const url = cfg<string>("confluenceUrl");

  if (forceConnected === true || (pat && url)) {
    statusBarItem.text            = "$(check) Confluence: Connected";
    statusBarItem.tooltip         = `${DISPLAY} — ${url}\nClick to reconfigure`;
    statusBarItem.backgroundColor = undefined;
  } else {
    statusBarItem.text            = "$(warning) Confluence: Not configured";
    statusBarItem.tooltip         = `${DISPLAY}: Click to configure your Confluence connection`;
    statusBarItem.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");

    if (!pat && !url) {
      vscode.window
        .showInformationMessage(
          `${DISPLAY}: Configure your Confluence connection to use Confluence tools in Copilot.`,
          "Configure Now",
          "Later"
        )
        .then((action) => { if (action === "Configure Now") runConfigure(context); });
    }
  }
  statusBarItem.show();
}

// ─── Activation ───────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext): void {
  out = vscode.window.createOutputChannel(DISPLAY);
  context.subscriptions.push(out);
  log("Extension activated");
  log(`VS Code version : ${vscode.version}`);
  log(`Platform        : ${process.platform} / Node ${process.version}`);

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = CFG + ".configure";
  context.subscriptions.push(statusBarItem);

  mcpChangeEmitter = new vscode.EventEmitter<void>();
  context.subscriptions.push(mcpChangeEmitter);

  context.subscriptions.push(
    vscode.commands.registerCommand(CFG + ".configure",        () => runConfigure(context)),
    vscode.commands.registerCommand(CFG + ".clearCredentials", () => runClearCredentials(context)),
    vscode.commands.registerCommand(CFG + ".testConnection",   () => runTestConnection(context)),
    vscode.commands.registerCommand(CFG + ".getToken",         () => getToken(context)),
    vscode.commands.registerCommand(CFG + ".showLogs",         () => out.show(true)),
  );

  // ── MCP server definition provider ────────────────────────────────────────
  context.subscriptions.push(
    vscode.lm.registerMcpServerDefinitionProvider(CFG, {
      onDidChangeMcpServerDefinitions: mcpChangeEmitter.event,

      async provideMcpServerDefinitions(_token) {
        const url = cfg<string>("confluenceUrl") ?? "";
        if (!url) return [];

        const serverPath = context.asAbsolutePath("dist/server.js");
        log(`MCP provideMcpServerDefinitions: url=${url}, serverPath=${serverPath}`);

        return [
          new vscode.McpStdioServerDefinition(
            DISPLAY,
            process.execPath,
            [serverPath],
            {
              CONFLUENCE_URL:           url,
              CONFLUENCE_USERNAME:      cfg<string>("username")  ?? "",
              CONFLUENCE_AUTH_MODE:     cfg<string>("authMode")  ?? "bearer",
              CONFLUENCE_INSTANCE_TYPE: cfg<string>("instanceType") ?? "cloud",
              CONFLUENCE_TOKEN:         "", // injected in resolveMcpServerDefinition
            }
          ),
        ];
      },

      async resolveMcpServerDefinition(server, _token) {
        const pat = await context.secrets.get(SECRET_KEY);
        if (!pat) {
          vscode.window
            .showWarningMessage(
              `${DISPLAY}: No token configured. Run '${DISPLAY}: Configure Confluence Connection'.`,
              "Configure Now"
            )
            .then((action) => { if (action === "Configure Now") runConfigure(context); });
          return undefined;
        }

        if (server instanceof vscode.McpStdioServerDefinition) {
          const url = cfg<string>("confluenceUrl") ?? "";
          log(`MCP resolveMcpServerDefinition: injecting token for ${url}`);
          return new vscode.McpStdioServerDefinition(
            server.label,
            server.command,
            server.args ?? [],
            {
              CONFLUENCE_URL:           url,
              CONFLUENCE_USERNAME:      cfg<string>("username")       ?? "",
              CONFLUENCE_AUTH_MODE:     cfg<string>("authMode")       ?? "bearer",
              CONFLUENCE_INSTANCE_TYPE: cfg<string>("instanceType")   ?? "cloud",
              CONFLUENCE_TOKEN:         pat,
            }
          );
        }
        return server;
      },
    })
  );

  void updateStatusBar(context);
}

export function deactivate(): void {
  log(`${DISPLAY} extension deactivated.`);
  statusBarItem?.dispose();
  out?.dispose();
}
