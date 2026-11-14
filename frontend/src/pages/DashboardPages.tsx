import { FormEvent, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  FolderOpen,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Upload
} from "lucide-react";
import { Badge, Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, TextArea } from "@/components/ui/input";
import { ApiError, api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";

export function DashboardPage() {
  const stats = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  const cards = [
    { label: "Knowledge Bases", value: stats.data?.knowledge_bases, icon: BookOpen, color: "text-blue-600 bg-blue-50 border-blue-200", to: "/knowledge-bases" },
    { label: "Total Documents", value: stats.data?.documents, icon: FolderOpen, color: "text-indigo-600 bg-indigo-50 border-indigo-200", to: "/documents" },
    { label: "Indexed Chunks", value: stats.data?.indexed_documents, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-200", to: "/documents" },
    { label: "Failed Documents", value: stats.data?.failed_documents, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200", to: "/admin" },
    { label: "Conversations", value: stats.data?.conversations, icon: MessageSquare, color: "text-purple-600 bg-purple-50 border-purple-200", to: "/chat" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageTitle
          title="Cluster Overview"
          subtitle="Real-time knowledge ingestion, vector counts, and active conversations."
        />
        <div className="flex items-center gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span>New Chat Session</span>
          </Link>
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* BUG-NAV-0001: Metrics cards link directly to their destination pages */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((item) => (
          <Link key={item.label} to={item.to} className="block group">
            <Card className="h-full border-slate-200 bg-white shadow-xs group-hover:border-blue-300 group-hover:shadow-sm transition-all cursor-pointer">
              <CardBody>
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                  <span className="group-hover:text-blue-600 transition-colors">{item.label}</span>
                  <span className={`p-1.5 rounded-lg border ${item.color} group-hover:scale-105 transition-transform`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                  {stats.isLoading ? "…" : item.value ?? 0}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link to="/chat" className="block group">
          <Card className="h-full border-slate-200 bg-white shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
            <CardBody className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-105 transition-transform shadow-2xs">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Hybrid GraphRAG Chat</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ask questions over indexed documents with multi-hop graph reasoning and verifiable source citations.
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/search" className="block group">
          <Card className="h-full border-slate-200 bg-white shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
            <CardBody className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 group-hover:scale-105 transition-transform shadow-2xs">
                  <Search className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Vector + BM25 Search</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect fused reciprocal rank candidates, similarity scores, and exact text chunks.
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/explore" className="block group">
          <Card className="h-full border-slate-200 bg-white shadow-xs hover:border-purple-300 hover:shadow-md transition-all">
            <CardBody className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 group-hover:scale-105 transition-transform shadow-2xs">
                  <Database className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Neo4j Entity Graph</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Visualize multi-document entity connections and extracted relationship graphs.
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Empty State Banner if no documents */}
      {!stats.isLoading && stats.data?.documents === 0 ? (
        <Card className="border-slate-200 bg-white">
          <CardBody className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Knowledge Base is Empty</h3>
              <p className="mt-1 text-sm text-slate-600">
                Upload your first PDF, DOCX, or text file to begin semantic chunking and entity extraction.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
              to="/knowledge-bases"
            >
              <span>Go to Knowledge Bases</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

export function KnowledgeBasesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bases = useQuery({ queryKey: ["knowledge-bases"], queryFn: api.knowledgeBases });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const canCreate = user?.role === "ADMIN" || user?.role === "KNOWLEDGE_MANAGER";

  const create = useMutation({
    mutationFn: () => {
      const cleanName = name.trim();
      const cleanDesc = description.trim();
      if (!cleanName) throw new Error("Knowledge Base Name is mandatory.");
      return api.createKnowledgeBase({ name: cleanName, description: cleanDesc, visibility: "PRIVATE" });
    },
    onSuccess: async () => {
      setName("");
      setDescription("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not create the knowledge base"),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageTitle
        title="Knowledge Bases"
        subtitle="Logical collections of documents with dedicated vector spaces and membership access."
      />

      {canCreate ? (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader title="Create New Knowledge Base" />
          <CardBody>
            <form
              className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"
              onSubmit={(event: FormEvent) => {
                event.preventDefault();
                setError("");
                create.mutate();
              }}
            >
              <div>
                <Label htmlFor="kb-name" required>Name</Label>
                <Input
                  id="kb-name"
                  aria-label="Name"
                  placeholder="e.g. Engineering Specs"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="kb-desc">Description</Label>
                <Input
                  id="kb-desc"
                  aria-label="Description"
                  placeholder="Brief description of documents inside"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button disabled={create.isPending} type="submit" className="w-full md:w-auto h-10">
                  {create.isPending ? "Creating..." : "Create Base"}
                </Button>
              </div>
            </form>
            {error ? <p className="mt-2 text-xs text-red-600 font-medium p-2.5 rounded-lg bg-red-50 border border-red-200">{error}</p> : null}
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(bases.data || []).map((base) => (
          <Link key={base.id} to={`/knowledge-bases/${base.id}`} className="block group">
            <Card className="h-full border-slate-200 bg-white shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
              <CardBody>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base">
                    {base.name}
                  </h2>
                  <Badge value={base.visibility} />
                </div>
                <p className="mt-2 min-h-10 text-sm text-slate-600">
                  {base.description || "No description provided."}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{base.document_count} documents indexed</span>
                  <span>{base.member_count} authorized members</span>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {!bases.isLoading && (bases.data || []).length === 0 ? (
        <Empty text="No knowledge bases are available to you yet. Create one above to get started." />
      ) : null}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export { TextArea };
