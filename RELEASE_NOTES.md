# Confluence MCP — v1.0.0 Release Notes

We are thrilled to announce the initial release of **Confluence MCP (v1.0.0)**, a secure, high-performance extension that connects your favorite AI assistants (such as GitHub Copilot, Claude, and other MCP-compatible clients) directly to Confluence. 

This release empowers you to search, read, create, and update wiki pages and comments seamlessly within VS Code using standard English instructions in your AI chat.

---

## 🚀 Key Features

### 🔍 Powerful CQL Search
- Full integration with **Confluence Query Language (CQL)** via the `confluence_search` tool.
- Supports filtering by space, exact title, last modified date, creators, and page tags.
- Enables ordering results (e.g., `ORDER BY lastmodified DESC`).

### 📄 Rich Page Operations
- **Read Pages (`confluence_get_page`)**: Retrieve full page bodies in clean HTML format.
- **Find Pages (`confluence_find_pages`)**: List pages within a space, with optional title filtering.
- **Browse Hierarchy (`confluence_get_page_children`)**: Easily traverse parent-child relationships.
- **Create (`confluence_create_page`)** & **Update (`confluence_update_page`)**: Author pages directly from AI chats with optimistic locking to prevent version conflicts.

### 🗂️ Space & Asset Navigation
- **Browse Spaces (`confluence_list_spaces`, `confluence_get_space`)**: List and detail all spaces available on your instance.
- **Attachments (`confluence_get_attachments`)**: Discover file attachments on any page along with download URLs.

### 💬 Interactive Comments
- **Read & Write Comments (`confluence_get_comments`, `confluence_add_comment`)**: Discuss and collaborate on pages right from your editor.

### 👤 Identity & User Resolution
- **Whoami (`confluence_whoami`)**: Verify your active authenticated account.
- **User Resolution (`confluence_find_user`)**: Resolve user display names or emails into correct `accountId` parameters to feed into advanced CQL queries. Includes robust multi-endpoint fallback logic.

---

## 🔒 Security First
- **No Plaintext Secrets**: Your Atlassian API tokens and Personal Access Tokens (PATs) are safely stored in the OS-level secure credential manager (Windows Credential Manager, macOS Keychain, or GNOME Keyring) using the **VS Code SecretStorage API**.
- **Subprocess Isolation**: Secrets are injected only at runtime via environment variables inside the isolated MCP node subprocess.

---

## 🌐 Dual-Environment Support
Confluence MCP automatically routes API calls according to your instance type:
*   **Confluence Cloud**: Built on the modern **Atlassian REST API v2** for pages, spaces, comments, and attachments, using Basic Auth (Email + API Token).
*   **Confluence Server / Data Center**: Fully compatible with **REST API v1** using secure Personal Access Tokens (PAT) Bearer authentication.

---

## 🛠️ Getting Started in 3 Steps
1. **Install the Extension**:
   - Open VS Code → Extensions (`Ctrl+Shift+X`) → `···` menu → **Install from VSIX…**
   - Select the packaged `confluence-mcp-1.0.0.vsix` bundle.
2. **Configure**:
   - Open Command Palette (`Ctrl+Shift+P`) → Run **`Confluence MCP: Configure Confluence Connection`**.
   - Input your instance URL, choose your connection type, and let the guided wizard verify and save your credentials.
3. **Chat**:
   - Start talking to GitHub Copilot or your local MCP client:
     > *"Search Confluence for pages about 'deployment runbook'"*
     > *"Read page 123456"*

---

## 📄 License & Ownership
- Published under the **MIT License**.
- Developed and maintained by **SutharLabs** (Suresh Suthar).
- *Disclaimer: This project is an independent tool and is not affiliated with or endorsed by Atlassian Pty Ltd.*
