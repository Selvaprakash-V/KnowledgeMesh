import { FormEvent, useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  Upload,
  FileText,
  RefreshCw,
  Trash2,
  Plus,
  Cloud,
  CheckCircle2,
  Check,
  Copy
} from "lucide-react";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, PageTitle } from "@/pages/DashboardPages";
import { ApiError, api } from "@/services/api";
import { formatBytes, formatWhen } from "@/lib/utils";
import type { ConnectorItem, DocumentItem } from "@/types";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export function KnowledgeBaseDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const base = useQuery({ queryKey: ["knowledge-base", id], queryFn: () => api.knowledgeBase(id) });
  const documents = useQuery({
    queryKey: ["kb-documents", id],
    queryFn: () => api.kbDocuments(id),
    refetchInterval: (query) =>
      (query.state.data || []).some((item) => item.status === "UPLOADED" || item.status === "PROCESSING") ? 2000 : false,
  });
  const members = useQuery({ queryKey: ["members", id], queryFn: () => api.members(id) });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BUG-FILE-0001: Prevent accidental browser navigation when dragging files outside the dropzone
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDropGlobal = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDropGlobal);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDropGlobal);
    };
  }, []);

  const upload = useMutation({
    mutationFn: (file: File) => api.upload(id, file),
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["kb-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Upload failed"),
  });

  function processUpload(file: File) {
    // BUG-FILE-0002: Client-side validation of file size before server transmission
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File "${file.name}" exceeds the maximum 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }
    setError("");
    upload.mutate(file);
  }

  if (base.isLoading) return <p className="text-sm text-slate-500">Loading knowledge base...</p>;
  if (base.isError || !base.data) return <p className="text-sm text-red-600">{base.error instanceof Error ? base.error.message : "Not found"}</p>;
  const kb = base.data;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && kb.can_manage) {
      processUpload(file);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle title={kb.name} subtitle={kb.description || "Dedicated vector index and entity graph collection."} />
        <div className="flex items-center gap-2">
          <Badge value={kb.visibility} />
          <Link
            to="/chat"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
          >
            Chat With This Base
          </Link>
        </div>
      </div>

      {kb.can_manage ? (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader title="Configuration & Metadata" />
          <CardBody>
            <form
              className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
              onSubmit={async (event: FormEvent) => {
                event.preventDefault();
                await api.updateKnowledgeBase(id, { name: name || kb.name, description });
                await queryClient.invalidateQueries({ queryKey: ["knowledge-base", id] });
              }}
            >
              <Input aria-label="Rename" defaultValue={kb.name} onChange={(event) => setName(event.target.value)} />
              <Input aria-label="Description" defaultValue={kb.description} onChange={(event) => setDescription(event.target.value)} />
              <Button type="submit" variant="outline">Save Changes</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      {/* Documents Card with Drag-and-Drop Zone */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader
          title="Indexed Documents"
          description="Files are parsed, chunked, and embedded asynchronously via Celery worker."
        />
        <CardBody className="space-y-6">
          {kb.can_manage ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50"
                  : "border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.markdown,.csv,.xlsx"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) processUpload(file);
                  event.target.value = "";
                }}
              />
              <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="font-bold text-sm text-slate-900">
                {upload.isPending ? "Uploading and enqueuing..." : "Click or drag & drop files to index"}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                PDF, DOCX, Markdown, Text, CSV &bull; Automatic SHA-256 deduplication
              </p>
            </div>
          ) : null}

          {error ? <p className="text-xs text-red-600 p-3 rounded-xl bg-red-50 border border-red-200 font-medium">{error}</p> : null}

          <DocumentRows
            documents={documents.data || []}
            canManage={kb.can_manage}
            onChange={() => queryClient.invalidateQueries({ queryKey: ["kb-documents", id] })}
          />
        </CardBody>
      </Card>

      {/* Membership Management */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader title="Access Control & Team Permissions" />
        <CardBody>
          {kb.can_manage ? (
            <form
              className="mb-6 flex flex-col gap-2 md:flex-row"
              onSubmit={async (event: FormEvent) => {
                event.preventDefault();
                setError("");
                try {
                  await api.addMember(id, { email, role });
                  setEmail("");
                  await queryClient.invalidateQueries({ queryKey: ["members", id] });
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : "Could not add member");
                }
              }}
            >
              <Input
                aria-label="Member email"
                placeholder="colleague@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <select
                aria-label="Member role"
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-600 shadow-2xs"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="VIEWER">Viewer</option>
                <option value="MANAGER">Manager</option>
              </select>
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Grant Access</span>
              </Button>
            </form>
          ) : null}

          <ul className="divide-y divide-slate-100 text-sm">
            {(members.data || []).map((member) => (
              <li key={member.user_id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-semibold text-slate-900">{member.name}</div>
                  <div className="text-xs text-slate-500">{member.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge value={member.role} />
                  {kb.can_manage && member.role !== "OWNER" ? (
                    <button
                      className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
                      onClick={async () => {
                        await api.removeMember(id, member.user_id);
                        await queryClient.invalidateQueries({ queryKey: ["members", id] });
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export function DocumentsPage() {
  const [tab, setTab] = useState<"documents" | "connectors">("documents");
  const documents = useQuery({ queryKey: ["documents"], queryFn: api.documents, refetchInterval: 5000 });
  const connectors = useQuery({ queryKey: ["connectors"], queryFn: api.connectors });
  const queryClient = useQueryClient();
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  async function handleSync(provider: string) {
    setSyncingProvider(provider);
    try {
      const res = await api.syncConnector(provider, true);
      setSyncToast(`Synced ${res.documents_ingested} new documents from ${provider} in ${res.duration_ms}ms.`);
      queryClient.invalidateQueries({ queryKey: ["connectors"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setTimeout(() => setSyncToast(null), 4000);
    } catch {
      setSyncToast("Sync failed");
      setTimeout(() => setSyncToast(null), 4000);
    } finally {
      setSyncingProvider(null);
    }
  }

  async function handleToggle(provider: string, currentEnabled: boolean) {
    await api.toggleConnector(provider, !currentEnabled);
    queryClient.invalidateQueries({ queryKey: ["connectors"] });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageTitle
          title={tab === "documents" ? "Knowledge Repository Documents" : "Automated Enterprise Connectors"}
          subtitle={
            tab === "documents"
              ? "Global view of all indexed files, chunk partitions, and entity extraction statuses across accessible collections."
              : "Zero-touch continuous delta synchronization for Google Drive, OneDrive/SharePoint, Notion, and daemon hot-folders."
          }
        />

        <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/80 p-1 self-start sm:self-auto">
          <button
            onClick={() => setTab("documents")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === "documents" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Indexed Documents</span>
          </button>
          <button
            onClick={() => setTab("connectors")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === "connectors" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            <span>Zero-Touch Connectors</span>
          </button>
        </div>
      </div>

      {syncToast ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{syncToast}</span>
        </div>
      ) : null}

      {tab === "documents" ? (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardBody>
            <DocumentRows
              documents={documents.data || []}
              canManage={true}
              emptyText="No documents uploaded across accessible knowledge bases yet."
              onChange={() => queryClient.invalidateQueries({ queryKey: ["documents"] })}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(connectors.data || []).map((conn: ConnectorItem) => (
              <Card key={conn.provider} className="border-slate-200 bg-white shadow-xs hover:border-blue-200 transition-all">
                <CardHeader
                  title={conn.name}
                  description={`Syncs every ${conn.sync_frequency_minutes} minutes from ${conn.folder_or_workspace_id || "default"}`}
                />
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      conn.status === "IDLE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      conn.status === "SYNCING" ? "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {conn.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Synced Documents</span>
                    <span className="font-mono font-bold text-slate-800">{conn.synced_documents_count} docs</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Last Delta Sync</span>
                    <span className="text-slate-500 text-[11px]">{conn.last_synced_at ? formatWhen(conn.last_synced_at) : "Never"}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!conn.enabled || syncingProvider === conn.provider}
                      onClick={() => handleSync(conn.provider)}
                      className="gap-1.5 flex-1"
                    >
                      <RefreshCw className={`h-3 w-3 ${syncingProvider === conn.provider ? "animate-spin" : ""}`} />
                      <span>{syncingProvider === conn.provider ? "Syncing..." : "Sync Delta"}</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleToggle(conn.provider, conn.enabled)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                        conn.enabled
                          ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {conn.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Webhook Endpoint for Zero-Touch Cloud Triggers */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader
              title="Continuous Ingestion Webhook"
              description="Configure this webhook URL in Google Drive or SharePoint to automatically trigger delta re-indexing upon document change."
            />
            <CardBody>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono text-xs text-slate-700">
                <span className="truncate">https://api.knowledgemesh.com/api/connectors/webhooks/delta_sync</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText("https://api.knowledgemesh.com/api/connectors/webhooks/delta_sync");
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="gap-1 ml-3"
                >
                  {copiedWebhook ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedWebhook ? "Copied" : "Copy URL"}</span>
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

function DocumentRows({
  documents,
  canManage,
  onChange,
  emptyText = "No documents in this collection.",
}: {
  documents: DocumentItem[];
  canManage: boolean;
  onChange: () => void;
  emptyText?: string;
}) {
  const [reindexingId, setReindexingId] = useState<string | null>(null);

  if (documents.length === 0) return <Empty text={emptyText} />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
          <tr>
            <th className="py-3 px-2">Document Name</th>
            <th className="px-2">Vector Index</th>
            <th className="px-2">Graph Status</th>
            <th className="px-2">Version</th>
            <th className="px-2">Size</th>
            <th className="px-2">Updated</th>
            {canManage ? <th className="px-2 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((document) => (
            <tr key={document.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="py-3.5 px-2">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[280px]">{document.filename}</span>
                </div>
                {document.error_message ? (
                  <div className="text-[11px] text-red-600 font-medium mt-0.5">{document.error_message}</div>
                ) : null}
                {document.graph_error ? (
                  <div className="text-[11px] text-slate-500 mt-0.5">{document.graph_error}</div>
                ) : null}
              </td>
              <td className="px-2"><Badge value={document.status} /></td>
              <td className="px-2"><Badge value={document.graph_status} /></td>
              <td className="px-2 text-xs font-mono text-slate-600 font-medium">v{document.version}</td>
              <td className="px-2 text-xs text-slate-600">{formatBytes(document.file_size)}</td>
              <td className="px-2 text-xs text-slate-500">{formatWhen(document.updated_at)}</td>
              {canManage ? (
                <td className="px-2 text-right space-x-3 text-xs">
                  <button
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                    disabled={reindexingId === document.id}
                    onClick={async () => {
                      setReindexingId(document.id);
                      try {
                        await api.reindex(document.id);
                        onChange();
                      } finally {
                        setReindexingId(null);
                      }
                    }}
                  >
                    <RefreshCw className={`h-3 w-3 ${reindexingId === document.id ? "animate-spin" : ""}`} />
                    <span>Reindex</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors font-semibold"
                    onClick={async () => {
                      if (confirm(`Delete document "${document.filename}"?`)) {
                        await api.deleteDocument(document.id);
                        onChange();
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
