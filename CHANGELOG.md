# Changelog

All notable changes to the Confluence MCP project will be documented in this file.

## [1.0.1] — 2026-05-19

### Fixed
- **Remote Host execution crash on Linux**: Changed the spawned command from the system-wide `"node"` binary to the programmatically resolved `process.execPath`. This forces the Confluence MCP server to run inside the exact same modern, bundled Node.js executable that VS Code / VS Code Server is running on, resolving startup syntax crashes (`SyntaxError: Unexpected token ...` from legacy system Node binaries).

### Added
- **Auto-Sync to VS Code Forks & Clients**: Implemented automatic synchronization of credentials and server details for major AI-focused VS Code forks and external clients. The extension now scans for, registers, and syncs configuration entries in `mcp_config.json` (or `claude_desktop_config.json`) for:
  - **Antigravity**
  - **KIRO**
  - **Cursor**
  - **Claude Desktop**
  This automatically registers the Confluence MCP server under the active tools list in these forks without requiring any manual configuration edits.

## [1.0.0] — 2026-05-18

### Added
- Initial release
- Modern Confluence API integration:
  - Supports Atlassian REST API v2 (Basic Auth with Email & API Token) for **Confluence Cloud**.
  - Supports Atlassian REST API v1 (Bearer PAT) for **Confluence Server / Data Center**.
- Confluence MCP Tools:
  - Searching via Confluence Query Language (CQL) (`confluence_search`).
  - Read & Author pages (`confluence_get_page`, `confluence_find_pages`, `confluence_create_page`, `confluence_update_page`, `confluence_get_page_children`).
  - Space management (`confluence_list_spaces`, `confluence_get_space`).
  - Comment collaboration (`confluence_get_comments`, `confluence_add_comment`).
  - Space asset browsing (`confluence_get_attachments`).
  - Identity & Account Resolution (`confluence_whoami`, `confluence_find_user` with email/name fallbacks).
- Guided connection configuration wizard with live connection testing.
- Status bar indicator displaying connection status.
- Secure token storage via VS Code SecretStorage (OS Keychain).
