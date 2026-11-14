import type { BenchmarkResult, Citation, ConnectorItem, Conversation, DashboardStats, DocumentItem, GraphEntity, KnowledgeBase, ResearchResult, SearchHit, User } from "@/types";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const TOKEN_KEY = "km_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, { ...options, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // BUG-AUTH-0004: Centralized 401 interceptor clears token & redirects to login with preserved route
    if (response.status === 401 && !path.includes("/api/auth/login") && !path.includes("/api/auth/register")) {
      setToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    const detail = Array.isArray(payload.error?.details) ? payload.error.details[0]?.msg : undefined;
    throw new ApiError(
      response.status,
      payload.error?.code || "REQUEST_FAILED",
      detail || payload.error?.message || payload.detail || "Request failed",
    );
  }
  return payload as T;
}

export const api = {
  register: (body: { email: string; password: string; name: string }) =>
    request<{ access_token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => request<User>("/api/auth/me"),
  dashboard: () => request<DashboardStats>("/api/dashboard"),
  status: () => request<Record<string, string | boolean>>("/api/system/status"),
  knowledgeBases: () => request<KnowledgeBase[]>("/api/knowledge-bases"),
  knowledgeBase: (id: string) => request<KnowledgeBase>(`/api/knowledge-bases/${id}`),
  createKnowledgeBase: (body: { name: string; description: string; visibility: string }) =>
    request<KnowledgeBase>("/api/knowledge-bases", { method: "POST", body: JSON.stringify(body) }),
  updateKnowledgeBase: (id: string, body: Partial<{ name: string; description: string; visibility: string }>) =>
    request<KnowledgeBase>(`/api/knowledge-bases/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteKnowledgeBase: (id: string) => request<void>(`/api/knowledge-bases/${id}`, { method: "DELETE" }),
  members: (id: string) => request<Array<{ user_id: string; email: string; name: string; role: string }>>(`/api/knowledge-bases/${id}/members`),
  addMember: (id: string, body: { email: string; role: string }) =>
    request(`/api/knowledge-bases/${id}/members`, { method: "POST", body: JSON.stringify(body) }),
  removeMember: (id: string, userId: string) => request<void>(`/api/knowledge-bases/${id}/members/${userId}`, { method: "DELETE" }),
  documents: () => request<DocumentItem[]>("/api/documents"),
  kbDocuments: (id: string) => request<DocumentItem[]>(`/api/knowledge-bases/${id}/documents`),
  upload: (id: string, file: File, replaces?: string) => {
    const data = new FormData();
    data.append("file", file);
    if (replaces) data.append("replaces_document_id", replaces);
    return request<DocumentItem>(`/api/knowledge-bases/${id}/documents`, { method: "POST", body: data });
  },
  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: "DELETE" }),
  reindex: (id: string) => request<DocumentItem>(`/api/documents/${id}/reindex`, { method: "POST" }),
  documentStatus: (id: string) => request<DocumentItem>(`/api/documents/${id}/status`),
  chunk: (documentId: string, chunkId: string) => request<Citation & { text: string }>(`/api/documents/${documentId}/chunks/${chunkId}`),
  conversations: () => request<Conversation[]>("/api/conversations"),
  conversation: (id: string) => request<Conversation>(`/api/conversations/${id}`),
  deleteConversation: (id: string) => request<void>(`/api/conversations/${id}`, { method: "DELETE" }),
  search: (body: { query: string; knowledge_base_id?: string; top_k?: number }) =>
    request<{ hits: SearchHit[]; retrieval: Record<string, number | string>; request_id: string }>("/api/search", { method: "POST", body: JSON.stringify(body) }),
  chat: (body: { message: string; conversation_id?: string; knowledge_base_id?: string; stream: boolean }) =>
    request<{ conversation_id: string; message_id: string; answer: string; citations: Citation[]; confidence: number | null; retrieval: Record<string, number>; model: string | null; request_id: string; latency_ms: number }>("/api/chat", { method: "POST", body: JSON.stringify(body) }),
  research: (body: { query: string; knowledge_base_id?: string; depth?: number }) =>
    request<ResearchResult>("/api/research", { method: "POST", body: JSON.stringify(body) }),
  feedback: (body: { message_id: string; rating: "HELPFUL" | "NOT_HELPFUL"; comment?: string }) =>
    request("/api/feedback", { method: "POST", body: JSON.stringify(body) }),
  users: () => request<User[]>("/api/users"),
  updateUser: (id: string, body: Partial<{ role: string; status: string; name: string }>) =>
    request<User>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  adminStats: () => request<Record<string, number | null>>("/api/admin/stats"),
  failures: () => request<Array<{ id: string; filename: string; error_message: string | null; graph_error: string | null; updated_at: string }>>("/api/admin/failures"),
  audit: () => request<Array<{ id: string; action: string; resource_type: string; created_at: string; ip_address: string | null }>>("/api/admin/audit-logs"),
  health: () => request<Record<string, { ok: boolean; error?: string }>>("/api/admin/health"),
  entities: (knowledgeBaseId?: string, q?: string) => {
    const params = new URLSearchParams();
    if (knowledgeBaseId) params.set("knowledge_base_id", knowledgeBaseId);
    if (q) params.set("q", q);
    return request<GraphEntity[]>(`/api/graph/entities?${params.toString()}`);
  },
  subgraph: (knowledgeBaseId?: string, limit: number = 100) => {
    const params = new URLSearchParams();
    if (knowledgeBaseId) params.set("knowledge_base_id", knowledgeBaseId);
    params.set("limit", String(limit));
    return request<{
      nodes: Array<{ id: string; name: string; type: string }>;
      links: Array<{ source: string; target: string; relation: string; confidence?: number }>;
    }>(`/api/graph/subgraph?${params.toString()}`);
  },
  entity: (id: string) => request<{
    id: string;
    name: string;
    type: string;
    knowledge_base_id: string;
    outgoing: Array<Record<string, string | number | null>>;
    incoming: Array<Record<string, string | number | null>>;
    sources: Array<{ document_id: string; filename: string; chunk_id: string }>;
  }>(`/api/graph/entities/${id}`),
  connectors: () => request<ConnectorItem[]>("/api/connectors"),
  syncConnector: (provider: string, incremental: boolean = true) =>
    request<{ provider: string; status: string; documents_discovered: number; documents_ingested: number; duration_ms: number; synced_at: string }>(
      `/api/connectors/${provider}/sync`,
      { method: "POST", body: JSON.stringify({ provider, incremental }) }
    ),
  toggleConnector: (provider: string, enabled: boolean) =>
    request<ConnectorItem>(`/api/connectors/${provider}/toggle?enabled=${enabled}`, { method: "POST" }),
  signedAuditExport: () =>
    request<{ status: string; algorithm: string; signature: string; record_count: number; exported_at: string; records: unknown[] }>(
      "/api/admin/audit-logs/export-signed"
    ),
  runBenchmark: () => request<BenchmarkResult>("/api/admin/benchmark/run", { method: "POST" }),
};

export async function streamChat(
  body: { message: string; conversation_id?: string; knowledge_base_id?: string },
  onEvent: (event: string, data: Record<string, unknown>) => void,
) {
  const headers = new Headers({ "Content-Type": "application/json" });
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(response.status, payload.error?.code || "CHAT_FAILED", payload.error?.message || "Chat failed");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(500, "CHAT_FAILED", "The response stream was empty.");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const part of parts) {
      let event = "message";
      let data = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) onEvent(event, JSON.parse(data));
    }
  }
}
