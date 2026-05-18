import axios, { type AxiosInstance } from "axios";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface PageVersion {
  number: number;
  createdAt?: string;
}

export interface PageBody {
  storage?: { value: string; representation: string };
}

export interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  status: string;
  version?: PageVersion;
  body?: PageBody;
  space?: { key: string; name: string };
  ancestors?: Array<{ id: string; title: string }>;
  _links?: { webui?: string; self?: string };
}

export interface ConfluenceSpace {
  id: string | number;
  key: string;
  name: string;
  type: string;
  status: string;
  description?: { plain?: { value: string } };
  _links?: { webui?: string };
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  space?: { key: string; name: string };
  excerpt?: string;
  lastModified?: string;
  _links?: { webui?: string };
}

export interface PageComment {
  id: string;
  title?: string;
  body?: PageBody;
  version?: PageVersion;
  _links?: { webui?: string };
}

export interface PageAttachment {
  id: string;
  title: string;
  mediaType: string;
  fileSize?: number;
  comment?: string;
  webuiLink?: string;
  downloadLink?: string;
  _links?: { download?: string; webui?: string };
  extensions?: { fileSize?: number };
}

export interface PaginatedResult<T> {
  results: T[];
  totalSize: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ConfluenceClient {
  readonly confluenceUrl: string;
  readonly isCloud: boolean;

  private readonly v1: AxiosInstance;
  private readonly v2: AxiosInstance;
  private readonly authHeaders: Record<string, string>;

  constructor(
    confluenceUrl: string,
    token: string,
    username: string,
    authMode: string,
    instanceType: string
  ) {
    this.confluenceUrl = confluenceUrl.replace(/\/+$/, "");
    this.isCloud       = instanceType === "cloud";

    const authHeader =
      authMode === "basic"
        ? "Basic " + Buffer.from(username + ":" + token).toString("base64")
        : "Bearer " + token;

    const headers = {
      Authorization:  authHeader,
      "Content-Type": "application/json",
      Accept:         "application/json",
    };
    this.authHeaders = headers;

    this.v1 = axios.create({
      baseURL: this.confluenceUrl + "/rest/api",
      headers,
      timeout: 30_000,
    });

    this.v2 = axios.create({
      baseURL: this.confluenceUrl + "/api/v2",
      headers,
      timeout: 30_000,
    });
  }

  // ── Pages ──────────────────────────────────────────────────────────────────

  async getPage(pageId: string): Promise<ConfluencePage> {
    if (this.isCloud) {
      const res = await this.v2.get<Record<string, unknown>>(`/pages/${pageId}`, {
        params: { "body-format": "storage" },
      });
      const spaceId = res.data["spaceId"] as string | undefined;
      const spaceHint = spaceId ? await this.resolveSpaceById(spaceId) : undefined;
      return this.normalizeV2Page(res.data, spaceHint);
    }
    const res = await this.v1.get<ConfluencePage>(`/content/${pageId}`, {
      params: { expand: "body.storage,version,space,ancestors" },
    });
    return res.data;
  }

  async findPages(
    spaceKey: string,
    title?: string,
    limit = 25
  ): Promise<PaginatedResult<ConfluencePage>> {
    if (this.isCloud) {
      const spaceId = await this.resolveSpaceId(spaceKey);
      // Resolve space name once for the whole list
      const spaceInfo = await this.resolveSpaceById(spaceId);
      const spaceHint = spaceInfo ?? { key: spaceKey, name: spaceKey };
      const params: Record<string, unknown> = { "space-id": spaceId, limit, "body-format": "storage" };
      if (title) params["title"] = title;
      const res = await this.v2.get<{ results: Record<string, unknown>[] }>("/pages", { params });
      const pages = res.data.results.map((p) => this.normalizeV2Page(p, spaceHint));
      return { results: pages, totalSize: pages.length };
    }
    const params: Record<string, unknown> = {
      spaceKey, type: "page", limit, expand: "body.storage,version,space",
    };
    if (title) params["title"] = title;
    const res = await this.v1.get<{ results: ConfluencePage[]; size: number }>("/content", { params });
    return { results: res.data.results, totalSize: res.data.size };
  }

  async createPage(
    spaceKey: string,
    title: string,
    body: string,
    parentId?: string
  ): Promise<ConfluencePage> {
    if (this.isCloud) {
      const spaceId = await this.resolveSpaceId(spaceKey);
      const payload: Record<string, unknown> = {
        spaceId, title, status: "current",
        body: { representation: "storage", value: body },
      };
      if (parentId) payload["parentId"] = parentId;
      const res = await this.v2.post<Record<string, unknown>>("/pages", payload);
      const spaceInfo = await this.resolveSpaceById(spaceId);
      return this.normalizeV2Page(res.data, spaceInfo ?? { key: spaceKey, name: spaceKey });
    }
    const payload: Record<string, unknown> = {
      type: "page", title,
      space: { key: spaceKey },
      body: { storage: { value: body, representation: "storage" } },
      status: "current",
    };
    if (parentId) payload["ancestors"] = [{ id: parentId }];
    const res = await this.v1.post<ConfluencePage>("/content", payload);
    return res.data;
  }

  async updatePage(
    pageId: string,
    title: string,
    body: string,
    currentVersion: number
  ): Promise<ConfluencePage> {
    if (this.isCloud) {
      const res = await this.v2.put<Record<string, unknown>>(`/pages/${pageId}`, {
        id: pageId, status: "current", title,
        version: { number: currentVersion + 1 },
        body: { representation: "storage", value: body },
      });
      const spaceId = res.data["spaceId"] as string | undefined;
      const spaceHint = spaceId ? await this.resolveSpaceById(spaceId) : undefined;
      return this.normalizeV2Page(res.data, spaceHint);
    }
    const page = await this.getPage(pageId);
    const res  = await this.v1.put<ConfluencePage>(`/content/${pageId}`, {
      type:    page.type,
      title,
      version: { number: currentVersion + 1 },
      body:    { storage: { value: body, representation: "storage" } },
    });
    return res.data;
  }

  async getPageChildren(pageId: string, limit = 25): Promise<PaginatedResult<ConfluencePage>> {
    if (this.isCloud) {
      const res = await this.v2.get<{ results: Record<string, unknown>[] }>("/pages", {
        params: { "parent-id": pageId, limit, "body-format": "storage" },
      });
      // Resolve space from the first result's spaceId if available
      let spaceHint: { key: string; name: string } | undefined;
      if (res.data.results.length > 0) {
        const spaceId = res.data.results[0]["spaceId"] as string | undefined;
        if (spaceId) spaceHint = await this.resolveSpaceById(spaceId);
      }
      const pages = res.data.results.map((p) => this.normalizeV2Page(p, spaceHint));
      return { results: pages, totalSize: pages.length };
    }
    const res = await this.v1.get<{ results: ConfluencePage[]; size: number }>(
      `/content/${pageId}/child/page`,
      { params: { limit, expand: "version,space" } }
    );
    return { results: res.data.results, totalSize: res.data.size };
  }

  // ── Spaces ─────────────────────────────────────────────────────────────────

  async listSpaces(limit = 25, type?: string): Promise<PaginatedResult<ConfluenceSpace>> {
    if (this.isCloud) {
      const params: Record<string, unknown> = { limit };
      if (type) params["type"] = type;
      const res = await this.v2.get<{ results: ConfluenceSpace[] }>("/spaces", { params });
      return { results: res.data.results, totalSize: res.data.results.length };
    }
    const params: Record<string, unknown> = { limit, expand: "description.plain" };
    if (type) params["type"] = type;
    const res = await this.v1.get<{ results: ConfluenceSpace[]; size: number }>("/space", { params });
    return { results: res.data.results, totalSize: res.data.size };
  }

  async getSpace(spaceKey: string): Promise<ConfluenceSpace> {
    if (this.isCloud) {
      const res = await this.v2.get<{ results: ConfluenceSpace[] }>("/spaces", {
        params: { keys: spaceKey },
      });
      if (!res.data.results.length) throw new Error(`Space not found: ${spaceKey}`);
      return res.data.results[0];
    }
    const res = await this.v1.get<ConfluenceSpace>(`/space/${spaceKey}`, {
      params: { expand: "description.plain" },
    });
    return res.data;
  }

  // ── Search — always V1 (no V2 CQL endpoint) ────────────────────────────────

  async search(cql: string, limit = 25): Promise<PaginatedResult<SearchResult>> {
    const res = await this.v1.get<{ results: SearchResult[]; totalSize: number }>(
      "/content/search",
      { params: { cql, limit, expand: "space,excerpt" } }
    );
    return { results: res.data.results, totalSize: res.data.totalSize };
  }

  // ── Comments ───────────────────────────────────────────────────────────────

  async getComments(pageId: string, limit = 25): Promise<PaginatedResult<PageComment>> {
    if (this.isCloud) {
      const res = await this.v2.get<{ results: PageComment[] }>("/footer-comments", {
        params: { "page-id": pageId, limit, "body-format": "storage" },
      });
      return { results: res.data.results, totalSize: res.data.results.length };
    }
    const res = await this.v1.get<{ results: PageComment[]; size: number }>(
      `/content/${pageId}/child/comment`,
      { params: { limit, expand: "body.storage,version" } }
    );
    return { results: res.data.results, totalSize: res.data.size };
  }

  async addComment(pageId: string, body: string): Promise<PageComment> {
    if (this.isCloud) {
      const res = await this.v2.post<PageComment>("/footer-comments", {
        pageId,
        body: { representation: "storage", value: body },
      });
      return res.data;
    }
    const res = await this.v1.post<PageComment>("/content", {
      type: "comment",
      container: { id: pageId, type: "page" },
      body: { storage: { value: body, representation: "storage" } },
    });
    return res.data;
  }

  // ── Attachments ────────────────────────────────────────────────────────────

  async getAttachments(pageId: string, limit = 25): Promise<PaginatedResult<PageAttachment>> {
    if (this.isCloud) {
      const res = await this.v2.get<{ results: PageAttachment[] }>("/attachments", {
        params: { "page-id": pageId, limit },
      });
      return { results: res.data.results, totalSize: res.data.results.length };
    }
    const res = await this.v1.get<{ results: PageAttachment[]; size: number }>(
      `/content/${pageId}/child/attachment`,
      { params: { limit, expand: "version" } }
    );
    return { results: res.data.results, totalSize: res.data.size };
  }

  // ── User — always V1 (no V2 user endpoint) ─────────────────────────────────

  async whoami(): Promise<Record<string, unknown>> {
    const res = await this.v1.get<Record<string, unknown>>("/user/current");
    return res.data;
  }

  async findUser(
    query: string,
    limit = 10
  ): Promise<{ users: Array<Record<string, unknown>>; debug: Array<{ endpoint: string; status: number | string }> }> {
    const debug: Array<{ endpoint: string; status: number | string }> = [];

    const normalize = (u: Record<string, unknown>) => ({
      accountId:   u["accountId"]   ?? u["userKey"]      ?? null,
      displayName: u["displayName"] ?? null,
      email:       u["email"]       ?? u["emailAddress"]  ?? null,
      profileUrl:  u["accountId"]
        ? `${this.confluenceUrl}/people/${u["accountId"]}`
        : null,
    });

    // Attempt 1: single-user lookup by username/email (works on Cloud + Server)
    try {
      const res = await this.v1.get<Record<string, unknown>>(
        "/user",
        { params: { username: query }, validateStatus: (s) => s < 500 }
      );
      debug.push({ endpoint: "GET /rest/api/user?username", status: res.status });
      if (res.status === 200 && res.data["accountId"]) {
        return { users: [normalize(res.data)], debug };
      }
    } catch (e: unknown) {
      debug.push({ endpoint: "GET /rest/api/user?username", status: String((e as { code?: string })?.code ?? "error") });
    }

    // Attempt 2: Cloud autocomplete picker — less restricted than /user/search
    try {
      const res = await this.v1.get<{ users: Array<Record<string, unknown>> }>(
        "/user/picker",
        { params: { query, limit }, validateStatus: (s) => s < 500 }
      );
      debug.push({ endpoint: "GET /rest/api/user/picker", status: res.status });
      if (res.status === 200 && Array.isArray(res.data?.users) && res.data.users.length > 0) {
        return { users: res.data.users.slice(0, limit).map(normalize), debug };
      }
    } catch (e: unknown) {
      debug.push({ endpoint: "GET /rest/api/user/picker", status: String((e as { code?: string })?.code ?? "error") });
    }

    // Attempt 3: Cloud — GET /user/search?query=<text>
    try {
      const res = await this.v1.get<Array<Record<string, unknown>>>(
        "/user/search",
        { params: { query, limit }, validateStatus: (s) => s < 500 }
      );
      debug.push({ endpoint: "GET /rest/api/user/search?query", status: res.status });
      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        return { users: res.data.slice(0, limit).map(normalize), debug };
      }
    } catch (e: unknown) {
      debug.push({ endpoint: "GET /rest/api/user/search?query", status: String((e as { code?: string })?.code ?? "error") });
    }

    // Attempt 4: Server/DC — GET /user/search?username=<text>
    try {
      const res = await this.v1.get<Array<Record<string, unknown>>>(
        "/user/search",
        { params: { username: query, limit }, validateStatus: (s) => s < 500 }
      );
      debug.push({ endpoint: "GET /rest/api/user/search?username", status: res.status });
      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        return { users: res.data.slice(0, limit).map(normalize), debug };
      }
    } catch (e: unknown) {
      debug.push({ endpoint: "GET /rest/api/user/search?username", status: String((e as { code?: string })?.code ?? "error") });
    }

    // Attempt 5: Atlassian People API (Cloud only) — org-wide directory, separate from Confluence REST
    if (this.isCloud) {
      try {
        const res = await axios.get<{ data?: Array<Record<string, unknown>> }>(
          "https://api.atlassian.com/people/1.0/user/find/byEmail",
          {
            params: { email: query, maxResults: limit },
            headers: this.authHeaders,
            validateStatus: (s) => s < 500,
            timeout: 15_000,
          }
        );
        debug.push({ endpoint: "GET api.atlassian.com/people/find/byEmail", status: res.status });
        if (res.status === 200 && Array.isArray(res.data?.data) && res.data.data!.length > 0) {
          return {
            users: res.data.data!.slice(0, limit).map((u) => ({
              accountId:   u["accountId"] ?? null,
              displayName: u["displayName"] ?? u["name"] ?? null,
              email:       u["email"] ?? null,
              profileUrl:  u["accountId"] ? `${this.confluenceUrl}/people/${u["accountId"]}` : null,
            })),
            debug,
          };
        }
      } catch (e: unknown) {
        debug.push({ endpoint: "GET api.atlassian.com/people/find/byEmail", status: String((e as { code?: string })?.code ?? "error") });
      }
    }

    return { users: [], debug };
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  /** Build a full URL from a webui link that may be relative or already absolute. */
  buildUrl(webuiLink?: string): string | null {
    if (!webuiLink) return null;
    return webuiLink.startsWith("http") ? webuiLink : this.confluenceUrl + webuiLink;
  }

  async resolveSpaceId(spaceKey: string): Promise<string> {
    const res = await this.v2.get<{ results: Array<{ id: string | number; key: string }> }>(
      "/spaces",
      { params: { keys: spaceKey } }
    );
    if (!res.data.results.length) throw new Error(`Space not found: ${spaceKey}`);
    return String(res.data.results[0].id);
  }

  /** Resolve a numeric V2 spaceId to { key, name }. Used to enrich single-page responses. */
  private async resolveSpaceById(spaceId: string): Promise<{ key: string; name: string } | undefined> {
    try {
      const res = await this.v2.get<{ id: string; key: string; name: string }>(`/spaces/${spaceId}`);
      return { key: res.data.key, name: res.data.name };
    } catch {
      return undefined;
    }
  }

  private normalizeV2Page(
    raw: Record<string, unknown>,
    spaceHint?: { key: string; name: string }
  ): ConfluencePage {
    // V2 body: { storage: { value, representation } }
    const body    = raw["body"]   as Record<string, unknown> | undefined;
    const storage = body?.["storage"] as PageBody["storage"] | undefined;

    // V2 URL: top-level `webuiLink` (absolute) or nested `_links.webui` (relative)
    const links    = raw["_links"] as Record<string, unknown> | undefined;
    const webuiLink = (raw["webuiLink"] as string | undefined)
                   ?? (links?.["webui"]  as string | undefined);

    return {
      id:      String(raw["id"]     ?? ""),
      title:   String(raw["title"]  ?? ""),
      type:    String(raw["type"]   ?? "page"),
      status:  String(raw["status"] ?? "current"),
      version: raw["version"] as PageVersion | undefined,
      body:    storage ? { storage } : undefined,
      space:   spaceHint,
      _links:  webuiLink ? { webui: webuiLink } : undefined,
    };
  }
}
