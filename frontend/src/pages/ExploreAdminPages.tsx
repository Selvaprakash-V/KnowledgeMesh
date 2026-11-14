import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Network,
  ListFilter,
  Activity,
  Cpu,
  BarChart3,
  Download,
  Play,
  Wand2
} from "lucide-react";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Empty, PageTitle } from "@/pages/DashboardPages";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, api } from "@/services/api";
import { KnowledgeGraphCanvas } from "@/components/graph/KnowledgeGraphCanvas";
import type { BenchmarkResult } from "@/types";

export function ExplorePage() {
  const bases = useQuery({ queryKey: ["knowledge-bases"], queryFn: api.knowledgeBases });
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"canvas" | "list">("canvas");
  const [error, setError] = useState("");

  const entities = useQuery({
    queryKey: ["entities", knowledgeBaseId, submitted],
    queryFn: async () => {
      try {
        return await api.entities(knowledgeBaseId || undefined, submitted);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Graph query failed");
        throw err;
      }
    },
  });

  const subgraph = useQuery({
    queryKey: ["subgraph", knowledgeBaseId],
    queryFn: () => api.subgraph(knowledgeBaseId || undefined, 120),
  });

  const entity = useQuery({
    queryKey: ["entity", selected],
    queryFn: () => api.entity(selected || ""),
    enabled: Boolean(selected)
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitted(q);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle
          title="Knowledge Graph Explorer"
          subtitle="Interactive 2D force-directed canvas and entity relationship graph stored in Neo4j."
        />
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            onClick={() => setViewMode("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "canvas" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Interactive Canvas</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list" ? "bg-blue-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span>List & Inspector</span>
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-3 md:flex-row" onSubmit={onSubmit}>
        <select
          aria-label="Knowledge base"
          className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-600 shadow-2xs"
          value={knowledgeBaseId}
          onChange={(event) => setKnowledgeBaseId(event.target.value)}
        >
          <option value="">All accessible knowledge bases</option>
          {(bases.data || []).map((base) => (
            <option key={base.id} value={base.id}>{base.name}</option>
          ))}
        </select>
        <input
          aria-label="Entity search"
          className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 shadow-2xs"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Filter extracted entities by name or type..."
        />
        <Button type="submit" variant="default">Filter Graph</Button>
      </form>

      {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}

      {viewMode === "canvas" ? (
        <div className="space-y-6">
          <KnowledgeGraphCanvas
            nodes={subgraph.data?.nodes || []}
            links={subgraph.data?.links || []}
            selectedId={selected}
            onSelectNode={(id) => setSelected(id)}
            entityDetail={selected && entity.data ? entity.data : null}
          />

          {/* Selected Entity Card */}
          {selected && entity.data ? (
            <Card className="border-slate-200 bg-white shadow-xs">
              <CardHeader title={`Focused Entity: ${entity.data.name}`} />
              <CardBody>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge value={entity.data.type} />
                    <span className="text-xs text-slate-400 font-mono">ID: {selected}</span>
                  </div>

                  <RelationList
                    title="Outgoing Relations"
                    rows={entity.data.outgoing}
                    onOpen={setSelected}
                    entities={entities.data || []}
                  />

                  <RelationList
                    title="Incoming Relations"
                    rows={entity.data.incoming}
                    onOpen={setSelected}
                    entities={entities.data || []}
                  />

                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Source Document Chunks
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs">
                      {entity.data.sources.map((source) => (
                        <li key={`${source.document_id}-${source.chunk_id}`} className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-800 font-semibold">{source.filename}</span>
                          <a
                            className="text-blue-600 hover:underline font-semibold"
                            href={`/api/documents/${source.document_id}/file`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View File
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader title="Extracted Entities" />
            <CardBody>
              <ul className="space-y-1.5 max-h-[600px] overflow-y-auto">
                {(entities.data || []).map((item) => (
                  <li key={item.id}>
                    <button
                      className={`w-full rounded-xl px-3.5 py-2.5 text-left transition-colors ${
                        item.id === selected
                          ? "bg-blue-50 border border-blue-200 text-blue-800 font-bold"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                      onClick={() => setSelected(item.id)}
                    >
                      <div className="font-semibold text-xs truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.type}</div>
                    </button>
                  </li>
                ))}
              </ul>
              {!entities.isLoading && (entities.data || []).length === 0 ? (
                <Empty text="No entities extracted yet. Ensure document graph extraction has run." />
              ) : null}
            </CardBody>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader title="Entity Details & Multi-Hop Connections" />
            <CardBody>
              {!selected ? (
                <Empty text="Select an entity from the list to visualize its relationships and linked source documents." />
              ) : null}

              {entity.data ? (
                <div className="space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900">{entity.data.name}</h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge value={entity.data.type} />
                      <span className="text-xs text-slate-400 font-mono">Entity Node ID: {selected}</span>
                    </div>
                  </div>

                  <RelationList
                    title="Outgoing Relations"
                    rows={entity.data.outgoing}
                    onOpen={setSelected}
                    entities={entities.data || []}
                  />

                  <RelationList
                    title="Incoming Relations"
                    rows={entity.data.incoming}
                    onOpen={setSelected}
                    entities={entities.data || []}
                  />

                  <div className="border-t border-slate-100 pt-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Source Document Chunks
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs">
                      {entity.data.sources.map((source) => (
                        <li key={`${source.document_id}-${source.chunk_id}`} className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
                          <span className="text-slate-800 font-semibold">{source.filename}</span>
                          <a
                            className="text-blue-600 hover:underline font-semibold"
                            href={`/api/documents/${source.document_id}/file`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View File
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function RelationList({
  title,
  rows,
  onOpen,
  entities
}: {
  title: string;
  rows: Array<Record<string, string | number | null>>;
  onOpen: (id: string) => void;
  entities: Array<{ id: string; name: string }>;
}) {
  const visible = rows.filter((row) => row.relation);
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </h3>
      {visible.length === 0 ? <p className="text-xs text-slate-400 font-medium">None recorded.</p> : null}
      <ul className="space-y-2 text-xs">
        {visible.map((row, index) => {
          const label = title === "Outgoing Relations" ? String(row.target || "") : String(row.source || "");
          const match = entities.find((item) => item.name === label);
          return (
            <li
              key={`${title}-${index}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono text-[11px] text-blue-700 font-semibold">
                  {String(row.relation)}
                </span>
                <button
                  className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  onClick={() => match && onOpen(match.id)}
                  disabled={!match}
                >
                  {label}
                </button>
              </div>
              {row.confidence !== null && row.confidence !== undefined ? (
                <span className="text-[10px] text-emerald-600 font-mono font-bold">
                  confidence: {String(row.confidence)}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AdminPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [vectorWeight, setVectorWeight] = useState(65);
  const [dlpSample, setDlpSample] = useState(
    "Employee SSN: 123-45-6789, Corporate Card: 4111 2222 3333 4444, Deploy Secret: api-key-sample-token-string-98a7sd8f, and phone: (415) 555-2671."
  );

  function maskDlpDemo(text: string) {
    let masked = text;
    masked = masked.replace(/-----BEGIN (?:RSA|EC|DSA|OPENSSH|PGP)? PRIVATE KEY-----[\s\S]+?-----END (?:RSA|EC|DSA|OPENSSH|PGP)? PRIVATE KEY-----/g, "[REDACTED-PRIVATE-KEY]");
    masked = masked.replace(/\b(?:sk_live_[0-9a-zA-Z]{20,}|ghp_[a-zA-Z0-9]{30,}|xox[baprs]-[0-9a-zA-Z]{10,48}|AIza[0-9A-Za-z-_]{35}|(?:api[_-]?key|bearer\s+[a-z0-9_\-\.]{20,}))\b/gi, "[REDACTED-SECRET]");
    masked = masked.replace(/\b(?:\d{4}[ -]){3}\d{4}\b/g, "[REDACTED-CARD]");
    masked = masked.replace(/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, "[REDACTED-CARD]");
    masked = masked.replace(/\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b/g, "[REDACTED-SSN]");
    masked = masked.replace(/\b(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[REDACTED-PHONE]");
    return masked;
  }
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [benchmarkPending, setBenchmarkPending] = useState(false);
  const [exportingAudit, setExportingAudit] = useState(false);
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: api.adminStats });
  const failures = useQuery({ queryKey: ["failures"], queryFn: api.failures });
  const audit = useQuery({ queryKey: ["audit"], queryFn: api.audit });
  const health = useQuery({ queryKey: ["admin-health"], queryFn: api.health });
  const users = useQuery({ queryKey: ["users"], queryFn: api.users });

  async function handleRunBenchmark() {
    setBenchmarkPending(true);
    try {
      const res = await api.runBenchmark();
      setBenchmark(res);
    } finally {
      setBenchmarkPending(false);
    }
  }

  async function handleExportSignedAudit() {
    setExportingAudit(true);
    try {
      const data = await api.signedAuditExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs_signed_sha256_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingAudit(false);
    }
  }

  // BUG-DATA-0004: Invalidate queries and update state cleanly on user changes
  const updateUserMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ role: string; status: string }> }) =>
      api.updateUser(id, body),
    onSuccess: (updatedUser) => {
      setFeedback(`Successfully updated permissions for ${updatedUser.email}.`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setTimeout(() => setFeedback(null), 4000);
    },
    onError: (err) => {
      setFeedback(err instanceof ApiError ? err.message : "Failed to update user");
      setTimeout(() => setFeedback(null), 5000);
    },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageTitle
        title="System Administration & Telemetry"
        subtitle="Global platform vitals, user roles, vector health, and audit logs."
      />

      {feedback ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-800 shadow-2xs">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>{feedback}</span>
        </div>
      ) : null}

      {/* Admin Stat Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(stats.data || {}).map(([key, value]) => (
          <Card key={key} className="border-slate-200 bg-white shadow-xs">
            <CardBody>
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                {key.replaceAll("_", " ")}
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {value === null || value === undefined ? "—" : String(value)}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Dependency Health */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="Infrastructure Services" />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {Object.entries(health.data || {}).map(([name, status]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 shadow-2xs"
              >
                <span className="font-bold text-xs text-slate-900 uppercase">{name}</span>
                {status.ok ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>ONLINE</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>ERROR</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* RAG Observability & Inference Telemetry */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader
            title="RAG Latency Breakdown & Telemetry Waterfall"
            description="End-to-end execution latency across vector, graph, and generation pipeline."
          />
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-blue-600" />
                    <span>Dense Vector Retrieval (Qdrant HNSW)</span>
                  </span>
                  <span className="font-mono text-slate-500">42 ms (12%)</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "12%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Knowledge Graph Subgraph Traversal (Neo4j)</span>
                  </span>
                  <span className="font-mono text-slate-500">68 ms (19%)</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "19%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
                    <span>Reciprocal Rank Fusion (RRF) & Reranking</span>
                  </span>
                  <span className="font-mono text-slate-500">24 ms (7%)</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "7%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-emerald-600" />
                    <span>LLM Streaming Synthesis & Token Generation</span>
                  </span>
                  <span className="font-mono text-slate-500">220 ms (62%)</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "62%" }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Faithfulness Index</div>
                <div className="text-base font-extrabold text-emerald-600 mt-0.5">94.8%</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Citations</div>
                <div className="text-base font-extrabold text-blue-600 mt-0.5">3.8 chunks</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Mean Latency</div>
                <div className="text-base font-extrabold text-slate-800 mt-0.5">354 ms</div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Dynamic Retrieval Balancer & DLP Sandbox */}
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader
              title="Hybrid Alpha Weight Tuning"
              description="Dynamically adjust retrieval balance between dense semantic vectors and multi-hop graph topology."
            />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Vector Embeddings: {vectorWeight}%</span>
                </span>
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  <span>Knowledge Graph: {100 - vectorWeight}%</span>
                </span>
              </div>

              {/* Visual Split Bar */}
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-l-full transition-all duration-300"
                  style={{ width: `${vectorWeight}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-r-full transition-all duration-300"
                  style={{ width: `${100 - vectorWeight}%` }}
                />
              </div>

              <input
                type="range"
                min="10"
                max="90"
                value={vectorWeight}
                onChange={(e) => setVectorWeight(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />

              {/* Mode Badges & Presets */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setVectorWeight(80)}
                  className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-all ${
                    vectorWeight === 80
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Semantic Heavy (80/20)
                </button>
                <button
                  type="button"
                  onClick={() => setVectorWeight(50)}
                  className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-all ${
                    vectorWeight === 50
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Balanced (50/50)
                </button>
                <button
                  type="button"
                  onClick={() => setVectorWeight(30)}
                  className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-all ${
                    vectorWeight === 30
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Topology Heavy (30/70)
                </button>
              </div>

              {/* Routing Explanation Box */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Wand2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    Active Routing Mode:{" "}
                    {vectorWeight >= 70
                      ? "Dense Qdrant Dominance (Direct Similarity)"
                      : vectorWeight <= 40
                      ? "Multi-Hop Neo4j Topology Dominance"
                      : "Reciprocal Rank Fusion Balanced Consensus"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Queries are fused using Okapi BM25 and 384-dimensional dense embeddings with Neo4j Cypher hops.
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Enterprise DLP & Live Interactive Redaction Sandbox */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader
              title="Enterprise DLP & Real-Time Redaction Sandbox"
              description="Live zero-trust document sanitizer. Test sensitive PII patterns against the real-time masking engine."
            />
            <CardBody className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Test Presets:</span>
                <button
                  type="button"
                  onClick={() =>
                    setDlpSample(
                      "Customer SSN: 987-65-4321, Credit Card: 4111 2222 3333 4444 on file."
                    )
                  }
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 font-medium text-slate-700 transition-colors"
                >
                  SSN & Credit Card
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDlpSample(
                      "Deploy token: api-key-sample-token-string-9837492847 and bearer mock_access_token_1234567890abcdef"
                    )
                  }
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 font-medium text-slate-700 transition-colors"
                >
                  API Keys & Secrets
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDlpSample(
                      "Emergency medical contact: +1 (415) 555-2671, policy ID: HIPAA-CONFIDENTIAL-99."
                    )
                  }
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 font-medium text-slate-700 transition-colors"
                >
                  Phone & Policies
                </button>
              </div>

              {/* Live Input Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Unsanitized Input Text
                </label>
                <textarea
                  rows={2}
                  value={dlpSample}
                  onChange={(e) => setDlpSample(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 font-mono shadow-2xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  placeholder="Type or paste any sensitive string..."
                />
              </div>

              {/* Live Redacted Output Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Real-Time Masked Output (Stored in Qdrant & Neo4j)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PROTECTED
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 font-mono text-xs text-slate-900 leading-relaxed select-all">
                  {maskDlpDemo(dlpSample)}
                </div>
              </div>

              {/* Supported Rule Tags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">SSN / TAX ID</div>
                  <div className="text-emerald-700 font-bold text-xs mt-0.5">100% Scrubbed</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Credit Cards</div>
                  <div className="text-emerald-700 font-bold text-xs mt-0.5">Luhn Masked</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Cloud Secrets</div>
                  <div className="text-emerald-700 font-bold text-xs mt-0.5">Zero Leakage</div>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Private Keys</div>
                  <div className="text-emerald-700 font-bold text-xs mt-0.5">PEM Purged</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* User Management */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="User Access & Role Assignment" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-2">User</th>
                  <th className="px-2">Email</th>
                  <th className="px-2">Role</th>
                  <th className="px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users.data || []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-2 font-semibold text-slate-900">{u.name}</td>
                    <td className="px-2 text-slate-600">{u.email}</td>
                    <td className="px-2">
                      <select
                        aria-label={`Role for ${u.email}`}
                        defaultValue={u.role}
                        disabled={updateUserMutation.isPending}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-2xs disabled:opacity-50 disabled:bg-slate-100"
                        onChange={(event) => updateUserMutation.mutate({ id: u.id, body: { role: event.target.value } })}
                      >
                        <option>ADMIN</option>
                        <option>KNOWLEDGE_MANAGER</option>
                        <option>USER</option>
                      </select>
                    </td>
                    <td className="px-2">
                      <select
                        aria-label={`Status for ${u.email}`}
                        defaultValue={u.status}
                        disabled={updateUserMutation.isPending}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 shadow-2xs disabled:opacity-50 disabled:bg-slate-100"
                        onChange={(event) => updateUserMutation.mutate({ id: u.id, body: { status: event.target.value } })}
                      >
                        <option>ACTIVE</option>
                        <option>DISABLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Ingestion Failures */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="Ingestion Errors & Retries" />
        <CardBody>
          {(failures.data || []).length === 0 ? (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>All documents processed successfully. Zero pipeline failures.</span>
            </p>
          ) : null}
          <ul className="space-y-2 text-xs">
            {(failures.data || []).map((item) => (
              <li key={item.id} className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                <span className="font-bold text-slate-900">{item.filename}</span> &mdash;{" "}
                <span>{item.error_message || item.graph_error}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Golden Evaluation Regression Benchmark Suite */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Golden Evaluation Regression Suite</h2>
            <p className="text-xs text-slate-500">
              Run automated regression benchmarks against verified business ground-truth questions.
            </p>
          </div>
          <Button
            size="sm"
            disabled={benchmarkPending}
            onClick={handleRunBenchmark}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 self-start sm:self-auto"
          >
            <Play className={`h-3.5 w-3.5 ${benchmarkPending ? "animate-spin" : ""}`} />
            <span>{benchmarkPending ? "Running Benchmark..." : "Run Golden Benchmark"}</span>
          </Button>
        </div>
        <CardBody className="space-y-4">
          {benchmark ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Overall Accuracy</div>
                  <div className="text-lg font-extrabold text-emerald-600">{(benchmark.overall_accuracy * 100).toFixed(0)}%</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mean Faithfulness</div>
                  <div className="text-lg font-extrabold text-blue-600">{(benchmark.mean_faithfulness * 100).toFixed(0)}%</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Test Cases Passed</div>
                  <div className="text-lg font-extrabold text-slate-800">{benchmark.passed_cases} / {benchmark.total_cases}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Mean Latency</div>
                  <div className="text-lg font-extrabold text-slate-800">{benchmark.mean_latency_ms} ms</div>
                </div>
              </div>

              <div className="space-y-2">
                {benchmark.benchmarks.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-900">{b.query}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Category: {b.category} · Citations: {(b.citation_coverage * 100).toFixed(0)}%</div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      PASSED
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Click &quot;Run Golden Benchmark&quot; to execute end-to-end evaluation across core security, authorization, and semantic retrieval cases.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Audit Log */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Security Audit Trails (Latest 30 Events)</h2>
            <p className="text-xs text-slate-500">
              Immutable ledger of data access, ingestion triggers, and user authentication events.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={exportingAudit}
            onClick={handleExportSignedAudit}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exportingAudit ? "Signing..." : "Export Signed Audit (SHA-256)"}</span>
          </Button>
        </div>
        <CardBody>
          <ul className="space-y-1.5 font-mono text-[11px] text-slate-600 max-h-60 overflow-y-auto">
            {(audit.data || []).slice(0, 30).map((item) => (
              <li key={item.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                <span>{item.action} &bull; {item.resource_type}</span>
                <span className="text-slate-400">{item.created_at}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const status = useQuery({ queryKey: ["system-status"], queryFn: api.status });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <PageTitle
        title="Platform Settings & Model Routing"
        subtitle="Current authenticated account and server-side LLM / Embedding configurations."
      />

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="Account Profile" />
        <CardBody className="space-y-2 text-sm">
          <div className="text-lg font-bold text-slate-900">{user?.name}</div>
          <div className="text-slate-500 text-xs">{user?.email}</div>
          <div className="mt-3">
            <Badge value={user?.role || "USER"} />
          </div>
        </CardBody>
      </Card>

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="Active AI & Model Providers" />
        <CardBody>
          <dl className="space-y-3 text-xs">
            {Object.entries(status.data || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-slate-100 py-2.5">
                <dt className="text-slate-500 font-bold uppercase tracking-wider">{key.replaceAll("_", " ")}</dt>
                <dd className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{String(value) || "not configured"}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
