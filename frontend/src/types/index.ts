export type Role = "ADMIN" | "KNOWLEDGE_MANAGER" | "USER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  created_at: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  visibility: "PRIVATE" | "INTERNAL";
  created_at: string;
  updated_at: string;
  document_count: number;
  member_count: number;
  can_manage: boolean;
}

export interface DocumentItem {
  id: string;
  knowledge_base_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  checksum: string;
  version: number;
  status: string;
  graph_status: string;
  error_message: string | null;
  graph_error: string | null;
  is_active: boolean;
  uploaded_by: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  index: number;
  document_id: string;
  document_name: string;
  page_number: number | null;
  chunk_id: string;
  knowledge_base_id: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  metadata_json: { citations?: Citation[]; retrieval?: Record<string, number | string>; confidence?: number | null };
  latency_ms: number | null;
  model: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  knowledge_base_id: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
}

export interface SearchHit {
  document_id: string;
  document_name: string;
  page_number: number | null;
  section: string | null;
  snippet: string;
  score: number;
  chunk_id: string;
  knowledge_base_id: string;
}

export interface GraphEntity {
  id: string;
  name: string;
  type: string;
  knowledge_base_id: string;
}

export interface DashboardStats {
  knowledge_bases: number;
  documents: number;
  indexed_documents: number;
  failed_documents: number;
  conversations: number;
}

export interface ResearchResult {
  title: string;
  query: string;
  executive_dossier: string;
  citations: Citation[];
  confidence: number | null;
  sub_queries: string[];
  entities_involved: string[];
  latency_ms: number;
}

export interface ConnectorItem {
  provider: string;
  name: string;
  enabled: boolean;
  sync_frequency_minutes: number;
  folder_or_workspace_id: string | null;
  last_synced_at: string | null;
  synced_documents_count: number;
  status: "IDLE" | "SYNCING" | "ERROR" | "DISABLED";
  error_message: string | null;
}

export interface BenchmarkResult {
  status: string;
  total_cases: number;
  passed_cases: number;
  overall_accuracy: number;
  mean_faithfulness: number;
  mean_latency_ms: number;
  timestamp: string;
  benchmarks: Array<{
    query: string;
    category: string;
    passed: boolean;
    faithfulness_score: number;
    citation_coverage: number;
    latency_ms: number;
  }>;
}


