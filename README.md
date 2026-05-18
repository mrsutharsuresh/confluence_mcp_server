# Confluence MCP

> Connect any AI assistant to Confluence via the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Search, read, create and update pages directly from your AI chat without leaving VS Code. Works with GitHub Copilot, Claude, and any other MCP-compatible AI client.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.99%2B-blue?logo=visualstudiocode)](https://code.visualstudio.com/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.10%2B-green)](https://github.com/modelcontextprotocol/typescript-sdk)
[![Confluence](https://img.shields.io/badge/Confluence-Cloud%20%7C%20Server%20%7C%20DC-0052CC?logo=confluence)](https://www.atlassian.com/software/confluence)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Authentication Guide](#authentication-guide)
  - [Which mode do I need?](#which-mode-do-i-need)
  - [Confluence Cloud — API Token](#confluence-cloud--api-token-basic-auth)
  - [Confluence Server / Data Center — PAT](#confluence-server--data-center--personal-access-token)
  - [Security: How credentials are stored](#security-how-credentials-are-stored)
- [Available MCP Tools](#available-mcp-tools)
- [VS Code Commands](#vs-code-commands)
- [Configuration Reference](#configuration-reference)
- [CQL Query Examples](#cql-query-examples)
- [Known Limitations](#known-limitations)
- [Source Layout](#source-layout)
- [Building from Source](#building-from-source)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [References](#references)

---

## Features

| Capability | Description |
|-----------|-------------|
| 🔍 **CQL Search** | Full-power Confluence Query Language search across all content types |
| 📄 **Read Pages** | Fetch page content (Confluence Storage Format / XHTML) by ID or space+title |
| ✏️ **Create Pages** | Create new pages in any space with rich HTML body |
| 🔄 **Update Pages** | Version-safe page updates (optimistic locking via version number) |
| 🗂️ **Browse Spaces** | List and inspect spaces by key |
| 🌳 **Page Hierarchy** | Navigate child pages of any parent |
| 💬 **Comments** | Read and add footer comments on pages |
| 📎 **Attachments** | List file attachments with download URLs |
| 👤 **Identity & User Lookup** | Verify active account; resolve email/name to accountId for CQL |
| ☁️ **Cloud + Server** | Works with Confluence Cloud (REST API v2) and Server / Data Center (REST API v1) |

---

## Quick Start

### 1 — Install the extension

- Open VS Code → **Extensions** (`Ctrl+Shift+X`) → `···` menu → **Install from VSIX…**
- Select the `confluence-mcp-*.vsix` file

### 2 — Configure your connection

- Open the Command Palette (`Ctrl+Shift+P`)
- Run **`Confluence MCP: Configure Confluence Connection`**
- Follow the guided wizard:
  1. Enter your Confluence base URL
  2. Select instance type (Cloud or Server/DC)
  3. Select auth mode (Basic or Bearer)
  4. Enter email *(Cloud only)*
  5. Enter your API token or PAT
  6. Extension verifies the connection before saving

### 3 — Use in your AI Chat

```
Search Confluence for pages about "kubernetes deployment"
Get the content of Confluence page 12345678
Find pages in the DEVOPS space with title containing "runbook"
List all spaces in Confluence
Get the children of page 987654321
Get comments on page 12345678
List attachments on page 12345678
Find the user with email john.doe@company.com
Who am I logged in as?
Create a new page in the DEVOPS space titled "Runbook: Redis"
```

> 💡 **Tip — Page IDs from URLs:** When you have a Confluence page URL like
> `https://yourco.atlassian.net/wiki/spaces/MYSPACE/pages/722760307/Page+Title`
> the page ID is the number in the path: **722760307**

---

## Authentication Guide

The extension supports two authentication modes depending on your Confluence deployment.

### Which mode do I need?

| Your Confluence | Instance Type | Auth Mode | What you need |
|----------------|---------------|-----------|---------------|
| `https://yourcompany.atlassian.net/wiki` | **Cloud** | **Basic** | Atlassian account email + API Token |
| `https://confluence.yourcompany.com` | **Server / DC** | **Bearer** | Personal Access Token (PAT) |

---

### Confluence Cloud — API Token (Basic Auth)

Confluence Cloud does **not** support password authentication for API calls. You must use an **Atlassian API Token**, which acts as your password in HTTP Basic authentication.

**Header sent by extension:** `Authorization: Basic base64(your@email.com:your_api_token)`

#### Steps to create an Atlassian API Token

1. Sign in to your Atlassian account at **[id.atlassian.com](https://id.atlassian.com)**

2. Go to **Security** → **API tokens**
   > 📎 Direct link: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)

3. Click **Create API token**

4. Enter a descriptive label (e.g. `VS Code Confluence MCP`) → click **Create**

5. **Copy the token immediately** — it will not be shown again

6. In the VS Code wizard enter:
   - **URL:** `https://yourcompany.atlassian.net/wiki`
   - **Instance type:** Cloud
   - **Auth mode:** Basic Auth (email + API token)
   - **Email:** your Atlassian account email
   - **Token:** the API token you just copied

> 📖 Official guide: [Manage API tokens for your Atlassian account](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)

#### Required Confluence Cloud permissions

| Permission | Required for |
|-----------|-------------|
| **Can use** (site-level) | All operations |
| **View Space** | Reading pages, spaces, comments, attachments |
| **Create Pages** | `confluence_create_page` |
| **Edit Pages** | `confluence_update_page` |
| **Add Comments** | `confluence_add_comment` |

> 📖 See: [Confluence Cloud permissions overview](https://support.atlassian.com/confluence-cloud/docs/what-are-confluence-cloud-permissions-and-restrictions/)

---

### Confluence Server / Data Center — Personal Access Token

Confluence Server 7.9+ and Data Center support **Personal Access Tokens (PATs)** — long-lived tokens that replace passwords for API and automation use.

**Header sent by extension:** `Authorization: Bearer your_personal_access_token`

#### Steps to create a PAT (Server / Data Center)

1. Log in to your Confluence instance

2. Click your **profile avatar** (top-right) → **Settings**
   > Or go directly to: `https://confluence.yourcompany.com/plugins/personalaccesstokens/usertokens.action`

3. In the left sidebar click **Personal Access Tokens**

4. Click **Create token**

5. Enter a name (e.g. `VS Code Confluence MCP`) and set an optional expiry date

6. Choose permissions:
   - ✅ **Read** — required for all read operations
   - ✅ **Write** — required for `create_page`, `update_page`, `add_comment`

7. Click **Create** and **copy the token** — it will not be shown again

8. In the VS Code wizard enter:
   - **URL:** `https://confluence.yourcompany.com` *(no trailing slash)*
   - **Instance type:** Server / Data Center
   - **Auth mode:** Bearer Token (PAT)
   - **Token:** the PAT you just copied

> 📖 Official guide (Server): [Using Personal Access Tokens](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html)
> 📖 Official guide (Data Center): [Personal Access Tokens](https://confluence.atlassian.com/doc/personal-access-tokens-985498861.html)

> ⚠️ **Minimum version:** PATs require Confluence Server **7.9+** or Data Center **7.9+**.

#### Required Confluence Server / DC permissions

| Permission | Required for |
|-----------|-------------|
| **Can Use** (global) | All operations |
| **View Space** | Reading pages, spaces, comments, attachments |
| **Create Pages** | `confluence_create_page` |
| **Edit Pages** | `confluence_update_page` |
| **Add Comments** | `confluence_add_comment` |

> 📖 See: [Global permissions overview](https://confluence.atlassian.com/doc/global-permissions-overview-138709.html)
> 📖 See: [Space permissions overview](https://confluence.atlassian.com/doc/space-permissions-overview-139521.html)

---

### Security: How credentials are stored

Your token is **never stored in plain text** or in VS Code settings files.

| Storage layer | What is stored |
|--------------|----------------|
| **VS Code Secret Storage** (OS keychain) | Your PAT / API token |
| **VS Code user settings** (`settings.json`) | URL, username, auth mode, instance type — non-sensitive |
| **MCP subprocess env vars** | Token injected at runtime only; never written to disk |

| OS | Keychain used |
|----|--------------|
| Windows | Windows Credential Manager |
| macOS | System Keychain |
| Linux | libsecret / GNOME Keyring |

> 📖 VS Code docs: [SecretStorage API](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)

---

## Available MCP Tools

13 tools are registered at startup. Tools marked ✅ have been live-tested against Confluence Cloud.

### 🔍 Search

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_search` | V1 (always) | ✅ Tested | Search using CQL — returns title, excerpt, space, URL |

### 📄 Pages

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_get_page` | V2 Cloud / V1 Server | ✅ Tested | Get a page by ID with full body content (HTML) |
| `confluence_find_pages` | V2 Cloud / V1 Server | ✅ Tested | List pages in a space; optional title filter |
| `confluence_get_page_children` | V2 Cloud / V1 Server | ✅ Tested | List direct child pages of a page |
| `confluence_create_page` | V2 Cloud / V1 Server | ⚠️ Not yet tested | Create a new page (body = Confluence Storage Format) |
| `confluence_update_page` | V2 Cloud / V1 Server | ⚠️ Not yet tested | Update title and/or body (requires current version number) |

### 🗂️ Spaces

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_list_spaces` | V2 Cloud / V1 Server | ✅ Tested | List accessible spaces with key, name, type, URL |
| `confluence_get_space` | V2 Cloud / V1 Server | ✅ Tested | Get details for a space by key |

### 💬 Comments

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_get_comments` | V2 Cloud / V1 Server | ✅ Tested | Get footer comments on a page |
| `confluence_add_comment` | V2 Cloud / V1 Server | ⚠️ Not yet tested | Add a footer comment (body = Storage Format) |

### 📎 Attachments

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_get_attachments` | V2 Cloud / V1 Server | ✅ Tested | List attachments with filename, type, size, download URL |

### 👤 User

| Tool | REST API | Status | Description |
|------|----------|--------|-------------|
| `confluence_whoami` | V1 (always) | ✅ Tested | Return the current authenticated user's profile |
| `confluence_find_user` | V1 (always) | ✅ Tested | Search for a user by email or display name; returns accountId for CQL queries. Includes a `debug` array showing which endpoints were tried and their HTTP status codes. |

> **API routing:**
> - **Cloud** → REST API **V2** (`/wiki/api/v2/`) for pages, spaces, comments, attachments; **V1** (`/wiki/rest/api/`) for search, whoami, and user lookup (no V2 equivalent)
> - **Server / Data Center** → REST API **V1** (`/wiki/rest/api/`) exclusively — V2 is Cloud-only

> **Body format:** All `body` fields use [Confluence Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html) (XHTML). When reading pages the raw HTML is returned; you can ask your AI assistant to summarise or extract specific information from it.

---

## VS Code Commands

Open the Command Palette (`Ctrl+Shift+P`) and type **Confluence MCP**:

| Command | Description |
|---------|-------------|
| `Confluence MCP: Configure Confluence Connection` | Guided wizard to set or update all credentials |
| `Confluence MCP: Test Confluence Connection` | Verify the saved credentials work right now |
| `Confluence MCP: Clear Saved Credentials` | Delete the stored token from the OS keychain |

---

## Configuration Reference

Accessible via VS Code Settings (`Ctrl+,`) → search **"Confluence MCP"**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `confluence-mcp.confluenceUrl` | `string` | `""` | Base URL, e.g. `https://yourco.atlassian.net/wiki` or `https://confluence.internal.com` |
| `confluence-mcp.instanceType` | `"cloud"` \| `"server"` | `"cloud"` | **Cloud** uses REST API V2; **Server/DC** uses V1 |
| `confluence-mcp.authMode` | `"basic"` \| `"bearer"` | `"bearer"` | **basic** = email + API token (Cloud); **bearer** = PAT (Server/DC) |
| `confluence-mcp.username` | `string` | `""` | Your email address — required when `authMode` is `basic` |

> ⚠️ The token itself is **not** stored in settings — it lives in the OS keychain. Use the configure wizard to set it.

---

## CQL Query Examples

[Confluence Query Language (CQL)](https://support.atlassian.com/confluence-cloud/docs/use-confluence-query-language-cql-in-confluence/) is a powerful search syntax. Use these with `confluence_search`:

```cql
-- All pages in a specific space
type=page AND space=DEVOPS

-- Pages containing a keyword
type=page AND text~"kubernetes deployment"

-- Find a page by exact title in a space
title="Release Notes" AND space.key=PROJ

-- Pages containing a name (when creator search is unavailable)
type=page AND text~"John Smith"

-- Pages in a space mentioning a keyword, most recent first
type=page AND space=MYSPACE AND text~"runbook" ORDER BY lastmodified DESC

-- Pages created by the current user
creator=currentUser() AND type=page

-- Pages created by a specific user (requires accountId from confluence_find_user)
creator="712020:abc123..." AND type=page

-- Pages modified in the last 30 days
type=page AND lastModified >= "-30d" ORDER BY lastmodified DESC

-- Pages tagged with a specific label
type=page AND label=runbook

-- Pages in a space modified after a specific date
space=MYSPACE AND lastModified >= "2024-01-01" ORDER BY lastmodified DESC
```

> ⚠️ **CQL syntax notes learned from real usage:**
> - Date relative values must be **quoted**: `lastModified >= "-7d"` ✅ &nbsp;&nbsp; `lastModified>=-7d` ❌
> - `ORDER BY` field name must be **lowercase**: `ORDER BY lastmodified DESC` ✅ &nbsp;&nbsp; `ORDER BY lastModified DESC` ❌
> - `creator` / `contributor` / `mention` fields require an **accountId** (e.g. `712020:abc...`), not an email address — use `confluence_find_user` first

> 📖 CQL reference: [Advanced searching using CQL](https://support.atlassian.com/confluence-cloud/docs/use-confluence-query-language-cql-in-confluence/)
> 📖 CQL fields: [https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/#fields](https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/#fields)

---

## Known Limitations

### User search on Confluence Cloud (Atlassian-managed orgs)

`confluence_find_user` attempts five different API endpoints to resolve an email or display name to an accountId. On many Atlassian-managed orgs (e.g., corporate or enterprise accounts), **all user search endpoints return 404** — this is a platform-level privacy restriction, not a bug.

The response always includes a `debug` array so you can see exactly which endpoints were tried:

```json
{
  "users": [],
  "message": "No users found matching: john@company.com",
  "debug": [
    { "endpoint": "GET /rest/api/user?username",        "status": 400 },
    { "endpoint": "GET /rest/api/user/picker",          "status": 404 },
    { "endpoint": "GET /rest/api/user/search?query",    "status": 404 },
    { "endpoint": "GET /rest/api/user/search?username", "status": 404 },
    { "endpoint": "GET api.atlassian.com/people/find/byEmail", "status": 404 }
  ]
}
```

**Workarounds:**
- Ask the person to share their Confluence profile URL: `https://yourco.atlassian.net/wiki/people/<accountId>` — the accountId is the path segment
- Use `text~"Display Name"` CQL to find pages mentioning them by name
- Use `creator=currentUser()` to find your own pages

### Large pages

`confluence_get_page` returns the full raw HTML body. Pages above ~40KB may be truncated by the tool output buffer. For very large pages, ask your AI assistant to search for specific sections by keyword rather than reading the whole body.

### Page body format

Body content is returned as **Confluence Storage Format** (XHTML with custom `<ac:*>` macros). When passing a body to `confluence_create_page` or `confluence_update_page`, use plain XHTML — e.g. `<p>Hello <strong>World</strong></p>`. Ask your AI assistant to format it for you.

### `confluence_search` excerpt field

The `excerpt` field in search results is often empty on Confluence Cloud (the V1 API does not always return excerpts). Use `confluence_get_page` to read the full content once you have the page ID.

---

## Source Layout

```
confluence-mcp/
├── src/
│   ├── extension.ts                  # VS Code extension host + MCP provider
│   └── server/
│       ├── index.ts                  # MCP server entry-point (McpServer + StdioServerTransport)
│       ├── confluence-client.ts      # Dual V2/V1 Axios client
│       └── tools/
│           ├── index.ts              # registerAllTools() — calls all group registers
│           ├── search/
│           │   ├── index.ts
│           │   └── cql-search.ts     # confluence_search
│           ├── pages/
│           │   ├── index.ts
│           │   ├── get-page.ts       # confluence_get_page
│           │   ├── find-pages.ts     # confluence_find_pages
│           │   ├── create-page.ts    # confluence_create_page
│           │   ├── update-page.ts    # confluence_update_page
│           │   └── get-children.ts   # confluence_get_page_children
│           ├── spaces/
│           │   ├── index.ts
│           │   ├── list-spaces.ts    # confluence_list_spaces
│           │   └── get-space.ts      # confluence_get_space
│           ├── comments/
│           │   ├── index.ts
│           │   ├── get-comments.ts   # confluence_get_comments
│           │   └── add-comment.ts    # confluence_add_comment
│           ├── attachments/
│           │   ├── index.ts
│           │   └── get-attachments.ts # confluence_get_attachments
│           └── user/
│               ├── index.ts
│               ├── whoami.ts         # confluence_whoami
│               └── find-user.ts      # confluence_find_user
├── dist/                             # Generated — gitignored
│   ├── extension.js                  # VS Code host bundle (esbuild)
│   └── server.js                     # MCP server bundle (spawned as subprocess)
├── package.json
├── tsconfig.json
├── esbuild.mjs
├── icon.png
├── README.md
└── LICENSE
```

---

## Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [VS Code](https://code.visualstudio.com/) 1.99+
- `vsce` — installed automatically via `devDependencies`

### Steps

```bash
# Clone the repository
git clone https://github.com/mrsutharsuresh/confluence_mcp_server.git
cd confluence_mcp_server

# Install dependencies
npm install

# Build both bundles (extension host + MCP server)
npm run build

# Package as .vsix
npm run package

# Install in VS Code:
# Extensions → ··· → Install from VSIX → select confluence-mcp-*.vsix
```

### Development (watch mode)

```bash
npm run watch    # rebuilds on every file save
```

### Type-check without building

```bash
npm run typecheck
```

---

## Troubleshooting

### "Authentication failed (HTTP 401)"
- **Cloud:** Verify the email address is correct. The API token must match the account at [id.atlassian.com](https://id.atlassian.com/manage-profile/security/api-tokens). Use `basic` auth mode.
- **Server/DC:** Check the PAT has not expired — regenerate at `https://your-confluence/plugins/personalaccesstokens/usertokens.action`. Use `bearer` auth mode.

### "Space not found: MYKEY"
- Verify the exact space key: **Space Settings → Space Details → Space Key**
- Space keys are case-sensitive.

### "Cannot connect to Confluence URL"
- **Cloud URL must include** `/wiki`: `https://yourco.atlassian.net/wiki`
- **Server URL must NOT include** `/wiki`: `https://confluence.internal.com`
- If Confluence is on a corporate network, ensure your VPN is active.

### MCP server not appearing in AI Chat
1. Run **`Confluence MCP: Test Confluence Connection`** to verify credentials
2. Reload VS Code: `Ctrl+Shift+P` → **Developer: Reload Window**
3. Check the output channel: `Ctrl+Shift+P` → **Output: Show Output Channels** → **Confluence MCP**

### VS Code Output shows `[warning] [server stderr] Server started — 13 tools registered`
This is **expected and normal**. VS Code routes all MCP subprocess stderr output to the output channel as `[warning]`, regardless of whether it is actually an error. The message is an informational startup log confirming the server loaded successfully.

### `confluence_find_user` returns empty results
This is a known Atlassian Cloud restriction — see [Known Limitations](#known-limitations). Check the `debug` array in the response to see which endpoints were tried and what HTTP status each returned. If all are 404, user search is disabled on your org.

### CQL search returns "400 Bad Request"
Common causes:
- **Unquoted relative dates:** Use `lastModified >= "-7d"` not `lastModified>=-7d`
- **Wrong ORDER BY casing:** Use `ORDER BY lastmodified` (lowercase) not `ORDER BY lastModified`
- **accountId in creator field:** `creator = "john@company.com"` is invalid; use the accountId from `confluence_find_user`

### VS Code version too old
This extension requires VS Code **1.99+** for the `lm.registerMcpServerDefinitionProvider` API.
Download the latest VS Code at [code.visualstudio.com](https://code.visualstudio.com/).

---

## Contributing

Contributions are welcome! This is an open-source community project.

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/my-new-tool
   ```

2. **Make your changes** — add a new tool file in the appropriate `src/server/tools/<group>/` directory and register it in the group's `index.ts`

3. **Type-check** before submitting:
   ```bash
   npm run typecheck
   ```

4. **Open a Pull Request** with a clear description of what the tool does and which Confluence API endpoint it uses

### Adding a new tool

Each tool follows the same pattern — export a `register(server, client)` function:

```typescript
// src/server/tools/pages/my-new-tool.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ConfluenceClient } from "../../confluence-client.js";

export function register(server: McpServer, client: ConfluenceClient): void {
  server.tool(
    "confluence_my_tool",
    "Description of what this tool does",
    { param: z.string().describe("What this param is") },
    async ({ param }) => ({
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    })
  );
}
```

Then import and call it in `src/server/tools/pages/index.ts`.

---

## License

MIT — see [LICENSE](LICENSE) for details.

This project is not affiliated with or endorsed by Atlassian. "Confluence" is a registered trademark of Atlassian Pty Ltd.

---

## References

| Resource | Link |
|----------|------|
| Model Context Protocol | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/getting-started/intro) |
| MCP TypeScript SDK | [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
| Confluence REST API V2 (Cloud) | [developer.atlassian.com/cloud/confluence/rest/v2/intro](https://developer.atlassian.com/cloud/confluence/rest/v2/intro/) |
| Confluence REST API V1 (Cloud) | [developer.atlassian.com/cloud/confluence/rest/v1/intro](https://developer.atlassian.com/cloud/confluence/rest/v1/intro/) |
| Confluence Server REST API | [docs.atlassian.com/confluence-server/rest/latest](https://docs.atlassian.com/confluence-server/rest/latest/) |
| Atlassian API Token management | [support.atlassian.com](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/) |
| Confluence Server PAT docs | [confluence.atlassian.com](https://confluence.atlassian.com/enterprise/using-personal-access-tokens-1026032365.html) |
| CQL reference | [developer.atlassian.com](https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/) |
