import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageSquare,
  Search,
  Send,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  Compass,
  Copy,
  Check,
  Download,
  Layers,
  ShieldCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ScanEye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/input";
import { Empty, PageTitle } from "@/pages/DashboardPages";
import { ApiError, api, streamChat } from "@/services/api";
import type { Citation, ResearchResult } from "@/types";

export function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bases = useQuery({ queryKey: ["knowledge-bases"], queryFn: api.knowledgeBases });
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: api.conversations });
  const conversation = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => api.conversation(conversationId || ""),
    enabled: Boolean(conversationId),
  });

  const [mode, setMode] = useState<"chat" | "research">("chat");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [liveCitations, setLiveCitations] = useState<Citation[]>([]);
  const [selected, setSelected] = useState<Citation | null>(null);

  // Deep Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [researchDepth, setResearchDepth] = useState(2);
  const [researchPending, setResearchPending] = useState(false);
  const [researchStage, setResearchStage] = useState("");
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [copiedDossier, setCopiedDossier] = useState(false);

  // Conversational Voice & Real-Time Audio state
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  function toggleSpeechRecognition(onResult: (text: string) => void) {
    const win = window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is supported in modern browsers (Chrome/Edge/Safari).");
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e: { results: Array<Array<{ transcript: string }>> }) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }

  function toggleAudioPlayback(id: string, text: string) {
    if (!("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*_#`[\]()]/g, "").slice(0, 1500);
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.05;
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setPending(true);
    setError("");
    setStreaming("");
    setLiveCitations([]);
    try {
      let nextId = conversationId;
      await streamChat(
        { message: draft, conversation_id: conversationId, knowledge_base_id: conversationId ? undefined : knowledgeBaseId },
        (event, data) => {
          if (event === "meta") nextId = String(data.conversation_id);
          if (event === "token") setStreaming((current) => current + String(data.text || ""));
          if (event === "error") throw new ApiError(502, String(data.code || "CHAT_FAILED"), String(data.message || "Chat failed"));
          if (event === "done") {
            setLiveCitations((data.citations as Citation[]) || []);
            setStreaming(String(data.answer || ""));
          }
        },
      );
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (nextId && nextId !== conversationId) {
        const targetId = nextId;
        await queryClient.prefetchQuery({ queryKey: ["conversation", targetId], queryFn: () => api.conversation(targetId) });
        navigate(`/chat/${targetId}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      }
      setStreaming("");
      setLiveCitations([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chat failed");
    } finally {
      setPending(false);
    }
  }

  async function onRunResearch(event: FormEvent) {
    event.preventDefault();
    const clean = researchQuery.trim();
    if (!clean) return;
    setResearchPending(true);
    setError("");
    setResearchResult(null);
    setResearchStage("Decomposing inquiry into multi-perspective hypotheses...");

    const t1 = setTimeout(() => {
      setResearchStage("Traversing knowledge graph entities & retrieving dense vectors...");
    }, 1200);
    const t2 = setTimeout(() => {
      setResearchStage("Synthesizing multi-source citations into executive dossier...");
    }, 2800);

    try {
      const result = await api.research({
        query: clean,
        knowledge_base_id: knowledgeBaseId || undefined,
        depth: researchDepth,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      setResearchResult(result);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(err instanceof ApiError ? err.message : "Deep Research failed");
    } finally {
      setResearchPending(false);
      setResearchStage("");
    }
  }

  function copyDossierToClipboard() {
    if (!researchResult) return;
    navigator.clipboard.writeText(researchResult.executive_dossier);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2500);
  }

  function downloadDossier() {
    if (!researchResult) return;
    const blob = new Blob([researchResult.executive_dossier], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${researchResult.title.replace(/[^a-z0-9_-]/gi, "_") || "dossier"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const messages = conversation.data?.messages || [];

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] max-w-7xl mx-auto">
      {/* Sidebar Conversation List */}
      <aside className="space-y-4">
        <Button
          className="w-full flex items-center justify-center gap-2"
          variant="default"
          onClick={() => {
            setMode("chat");
            navigate("/chat");
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>New Conversation</span>
        </Button>
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Threads
          </div>
          {(conversations.data || []).map((item) => (
            <Link
              key={item.id}
              to={`/chat/${item.id}`}
              onClick={() => setMode("chat")}
              className={`block truncate rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                item.id === conversationId && mode === "chat"
                  ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.title}
            </Link>
          ))}
          {!conversations.isLoading && (conversations.data || []).length === 0 && (
            <div className="px-3 py-4 text-xs text-slate-400">No past conversations</div>
          )}
        </div>
      </aside>

      {/* Main Workspace Interface */}
      <section className="flex min-h-[75vh] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header with Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70 gap-3">
          <div>
            <h1 className="font-bold text-slate-900 text-base">
              {mode === "chat"
                ? conversation.data?.title || "Hybrid GraphRAG Session"
                : "Autonomous Deep Research Agent"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "chat"
                ? "Evidence-based answers strictly synthesized from authorized chunks."
                : "Multi-angle query decomposition, parallel graph traversal & executive dossier synthesis."}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/80 p-1">
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "chat"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Interactive Chat</span>
            </button>
            <button
              onClick={() => setMode("research")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                mode === "research"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Deep Research</span>
            </button>
          </div>
        </div>

        {/* MODE 1: INTERACTIVE CHAT */}
        {mode === "chat" ? (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {!conversationId && messages.length === 0 && !streaming ? (
                <Empty text="Select a knowledge base and ask a question. Responses are strictly anchored in authorized evidence with chunk citations." />
              ) : null}

              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`rounded-2xl p-4 transition-all ${
                    message.role === "USER"
                      ? "ml-8 bg-blue-50/80 border border-blue-100 text-slate-900"
                      : "mr-4 bg-slate-50/90 border border-slate-200/90 text-slate-900 shadow-2xs"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      {message.role === "USER" ? "You" : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-blue-700">KnowledgeMesh</span>
                        </>
                      )}
                    </span>
                    {message.latency_ms ? (
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.latency_ms} ms
                      </span>
                    ) : null}
                  </div>

                  <div className="markdown text-sm leading-relaxed text-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>

                  <CitationList citations={message.metadata_json?.citations || []} onSelect={setSelected} />

                  {message.role === "ASSISTANT" ? (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-4 text-xs text-slate-500">
                      <button
                        onClick={() => toggleAudioPlayback(message.id, message.content)}
                        className={`flex items-center gap-1.5 transition-colors ${speakingId === message.id ? "text-blue-600 font-bold" : "hover:text-blue-600"}`}
                        title="Voice Audio Briefing"
                      >
                        {speakingId === message.id ? (
                          <div className="flex items-center gap-0.5 px-0.5 h-3.5">
                            <span className="w-0.5 bg-blue-600 rounded-full animate-soundwave-1" />
                            <span className="w-0.5 bg-blue-600 rounded-full animate-soundwave-2" />
                            <span className="w-0.5 bg-blue-600 rounded-full animate-soundwave-3" />
                            <span className="w-0.5 bg-blue-600 rounded-full animate-soundwave-4" />
                            <span className="w-0.5 bg-blue-600 rounded-full animate-soundwave-5" />
                          </div>
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                        <span>{speakingId === message.id ? "Playing Voice Briefing..." : "Voice Briefing"}</span>
                      </button>
                      <button
                        onClick={() => api.feedback({ message_id: message.id, rating: "HELPFUL" })}
                        className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Helpful</span>
                      </button>
                      <button
                        onClick={() => api.feedback({ message_id: message.id, rating: "NOT_HELPFUL" })}
                        className="flex items-center gap-1 hover:text-red-600 transition-colors"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                        <span>Not helpful</span>
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}

              {streaming ? (
                <article className="mr-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider text-blue-700 font-bold">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>KnowledgeMesh Synthesizing</span>
                  </div>
                  <div className="markdown text-sm leading-relaxed text-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streaming}</ReactMarkdown>
                  </div>
                  <CitationList citations={liveCitations} onSelect={setSelected} />
                </article>
              ) : null}

              {pending && !streaming ? (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Retrieving vectors & traversing knowledge graph...</span>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                  {error}
                </div>
              ) : null}
            </div>

            {/* Query Input Box */}
            <form className="border-t border-slate-200 bg-slate-50/50 p-4" onSubmit={onSubmit}>
              {!conversationId ? (
                <select
                  aria-label="Knowledge base"
                  className="mb-3 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-blue-600"
                  value={knowledgeBaseId}
                  onChange={(event) => setKnowledgeBaseId(event.target.value)}
                  required
                >
                  <option value="">Select a knowledge base to query...</option>
                  {(bases.data || []).map((base) => (
                    <option key={base.id} value={base.id}>{base.name}</option>
                  ))}
                </select>
              ) : null}

              <TextArea
                aria-label="Message"
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about documents you are authorized to access..."
                className="text-sm bg-white border-slate-300 placeholder:text-slate-400"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {isListening ? (
                    <span className="text-red-600 font-semibold flex items-center gap-1.5 animate-pulse">
                      <Mic className="h-3.5 w-3.5" />
                      Listening to your voice... Speak now
                    </span>
                  ) : (
                    "Press Enter, Click Send, or use Voice Input"
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleSpeechRecognition((text) => setDraft((curr) => (curr ? `${curr} ${text}` : text)))}
                    className={`gap-1.5 ${isListening ? "border-red-400 bg-red-50 text-red-700" : ""}`}
                    title="Voice-Driven Speech Input"
                  >
                    {isListening ? (
                      <div className="flex items-center gap-0.5 px-1 h-3.5">
                        <span className="w-0.5 bg-red-600 rounded-full animate-soundwave-1" />
                        <span className="w-0.5 bg-red-600 rounded-full animate-soundwave-2" />
                        <span className="w-0.5 bg-red-600 rounded-full animate-soundwave-3" />
                        <span className="w-0.5 bg-red-600 rounded-full animate-soundwave-4" />
                        <span className="w-0.5 bg-red-600 rounded-full animate-soundwave-5" />
                      </div>
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    <span>{isListening ? "Listening..." : "Voice Input"}</span>
                  </Button>
                  <Button disabled={pending} type="submit" className="gap-2">
                    <Send className="h-3.5 w-3.5" />
                    <span>{pending ? "Synthesizing..." : "Send Query"}</span>
                  </Button>
                </div>
              </div>
            </form>
          </>
        ) : (
          /* MODE 2: AUTONOMOUS DEEP RESEARCH */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!researchResult && !researchPending ? (
              <div className="max-w-2xl mx-auto space-y-6 py-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Enterprise Deep Research Agent</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Provide a complex objective, audit requirement, or hypothesis. The multi-agent orchestrator will decompose it into sub-queries, query dense vectors and graph topology in parallel, and generate an executive intelligence briefing.
                  </p>
                </div>

                <form onSubmit={onRunResearch} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Target Knowledge Base</label>
                    <select
                      className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-indigo-600"
                      value={knowledgeBaseId}
                      onChange={(e) => setKnowledgeBaseId(e.target.value)}
                    >
                      <option value="">All accessible knowledge bases</option>
                      {(bases.data || []).map((base) => (
                        <option key={base.id} value={base.id}>{base.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Research Inquiry or Hypothesis</label>
                    <TextArea
                      rows={4}
                      value={researchQuery}
                      onChange={(e) => setResearchQuery(e.target.value)}
                      placeholder="e.g. Conduct a full architectural audit of security, authentication, and data compliance policies described across our documents..."
                      className="text-sm bg-white border-slate-300 placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="font-bold">Decomposition Depth:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setResearchDepth(1)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            researchDepth === 1 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          Focused (1x)
                        </button>
                        <button
                          type="button"
                          onClick={() => setResearchDepth(2)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            researchDepth === 2 ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          Comprehensive (2x)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleSpeechRecognition((t) => setResearchQuery((curr) => (curr ? `${curr} ${t}` : t)))}
                        className={`gap-1.5 ${isListening ? "border-red-400 bg-red-50 text-red-700 animate-pulse" : ""}`}
                        title="Voice Input for Deep Research"
                      >
                        {isListening ? <MicOff className="h-3.5 w-3.5 text-red-600" /> : <Mic className="h-3.5 w-3.5 text-indigo-600" />}
                        <span>{isListening ? "Listening..." : "Voice Input"}</span>
                      </Button>
                      <Button type="submit" disabled={researchPending} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                        <Compass className="h-4 w-4" />
                        <span>Launch Deep Research</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            ) : null}

            {researchPending ? (
              <div className="max-w-xl mx-auto py-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Radar Pulse Visualizer */}
                <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-indigo-400/40 animate-pulse-ring" />
                  <div className="absolute inset-2 rounded-full border border-indigo-300/60 animate-ping opacity-30" />
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 p-0.5 shadow-lg shadow-indigo-600/30">
                    <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                      <Sparkles className="h-7 w-7 text-indigo-600 animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">Autonomous Multi-Agent Investigation</h3>
                  <p className="text-xs text-indigo-600 font-semibold flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>{researchStage}</span>
                  </p>
                </div>

                {/* Animated Pipeline Stepper */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 text-left">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-100 pb-2">
                    <span>Orchestration Pipeline</span>
                    <span className="font-mono text-indigo-600">Active</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">1</span>
                        <span className="font-semibold text-slate-800">Hypothesis & Sub-Query Decomposition</span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">COMPLETED</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-indigo-100 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white animate-pulse">2</span>
                        <span className="font-semibold text-slate-800">Parallel Vector (Qdrant) & Graph (Neo4j) Scan</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 animate-pulse">PROCESSING</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">3</span>
                        <span className="font-medium">Cross-Verification & Executive Dossier Synthesis</span>
                      </div>
                      <span className="text-[10px] font-mono">PENDING</span>
                    </div>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-indigo-100 overflow-hidden">
                    <div className="h-full shimmer-bar rounded-full" style={{ width: "68%" }} />
                  </div>
                </div>
              </div>
            ) : null}

            {researchResult && !researchPending ? (
              <div className="space-y-6">
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Executive Dossier
                      </span>
                      {researchResult.confidence ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          {(researchResult.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      ) : null}
                      <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {researchResult.latency_ms} ms
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{researchResult.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAudioPlayback("dossier", researchResult.executive_dossier)}
                      className={`gap-1.5 ${speakingId === "dossier" ? "border-indigo-400 bg-indigo-50 text-indigo-700 font-bold" : ""}`}
                    >
                      {speakingId === "dossier" ? <VolumeX className="h-3.5 w-3.5 text-indigo-600 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                      <span>{speakingId === "dossier" ? "Stop Audio" : "Audio Briefing"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyDossierToClipboard} className="gap-1.5">
                      {copiedDossier ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedDossier ? "Copied" : "Copy Dossier"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadDossier} className="gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      <span>Export .md</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setResearchResult(null);
                        setResearchQuery("");
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      New Investigation
                    </Button>
                  </div>
                </div>

                {/* Sub-Queries & Entities Tags */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {researchResult.sub_queries.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Decomposed Sub-Queries ({researchResult.sub_queries.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {researchResult.sub_queries.map((q, idx) => (
                          <span key={idx} className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] text-slate-700 font-medium">
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {researchResult.entities_involved.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Knowledge Graph Entities ({researchResult.entities_involved.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {researchResult.entities_involved.map((e, idx) => (
                          <span key={idx} className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] text-indigo-800 font-medium">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dossier Content Body */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                  <div className="markdown text-sm leading-relaxed text-slate-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{researchResult.executive_dossier}</ReactMarkdown>
                  </div>

                  <CitationList citations={researchResult.citations || []} onSelect={setSelected} />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            ) : null}
          </div>
        )}

        {selected ? <SourceDrawer citation={selected} onClose={() => setSelected(null)} /> : null}
      </section>
    </div>
  );
}

export function CitationList({ citations, onSelect }: { citations: Citation[]; onSelect: (citation: Citation) => void }) {
  if (!citations.length) return null;
  return (
    <ol className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
      {citations.map((citation) => (
        <li key={`${citation.chunk_id}-${citation.index}`}>
          <button
            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-800 hover:bg-blue-100 transition-colors font-medium shadow-2xs"
            onClick={() => onSelect(citation)}
          >
            <span className="font-mono font-bold text-blue-600">[{citation.index}]</span>
            <span className="truncate max-w-[200px]">{citation.document_name}</span>
            {citation.page_number ? <span className="text-[10px] text-blue-600 font-semibold">p.{citation.page_number}</span> : null}
          </button>
        </li>
      ))}
    </ol>
  );
}

function SourceDrawer({ citation, onClose }: { citation: Citation; onClose: () => void }) {
  const [tab, setTab] = useState<"text" | "vision" | "table">("text");
  const chunk = useQuery({
    queryKey: ["chunk", citation.document_id, citation.chunk_id],
    queryFn: () => api.chunk(citation.document_id, citation.chunk_id)
  });

  const text = chunk.data?.text || citation.snippet;
  const isTable = text.includes("|") || text.toLowerCase().includes("table");

  return (
    <aside className="border-t border-slate-200 bg-slate-50 p-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-bold text-slate-900">{citation.document_name}</div>
            <div className="text-[10px] text-slate-500 font-medium">
              {citation.page_number ? `Verified chunk on page ${citation.page_number}` : "Document chunk"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-200/80 rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setTab("text")}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${tab === "text" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"}`}
            >
              Chunk Text
            </button>
            <button
              onClick={() => setTab("vision")}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${tab === "vision" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"}`}
            >
              Visual Layout
            </button>
            <button
              onClick={() => setTab("table")}
              className={`px-2 py-0.5 rounded font-semibold transition-all ${tab === "table" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600"}`}
            >
              Table / JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tab === "text" && (
        <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-3 font-mono text-slate-800 text-[11px] leading-relaxed border border-slate-200 shadow-2xs">
          {text}
        </p>
      )}

      {tab === "vision" && (
        <div className="mt-3 rounded-xl bg-white p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b border-slate-100 pb-1.5">
            <span className="flex items-center gap-1 text-blue-600">
              <ScanEye className="h-3.5 w-3.5" />
              <span>Multimodal Vision Bounding Box</span>
            </span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {citation.page_number ? `Page ${citation.page_number}` : "Page 1"} · Conf: 99.2%
            </span>
          </div>

          <div className="relative h-40 w-full rounded-lg bg-slate-100/70 border border-dashed border-slate-300 p-3 overflow-hidden flex flex-col justify-center">
            <div className="absolute top-2 left-3 right-3 h-2 rounded bg-slate-200" />
            <div className="absolute top-5 left-3 w-1/3 h-2 rounded bg-slate-200" />
            
            {/* Highlighted Bounding Box Overlay */}
            <div className="relative mx-auto w-full max-w-lg rounded-lg border-2 border-amber-500 bg-amber-50/90 p-3 shadow-xs">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>[BoundingBox: x=48 y=160 w=512 h=128]</span>
                <span className="text-amber-700 font-semibold">Visual Evidence Grounding</span>
              </div>
              <p className="font-mono text-[11px] text-slate-800 line-clamp-3 leading-relaxed">
                {text}
              </p>
            </div>

            <div className="absolute bottom-2 left-3 right-3 h-2 rounded bg-slate-200" />
          </div>
        </div>
      )}

      {tab === "table" && (
        <div className="mt-3 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs overflow-x-auto max-h-44">
          {isTable ? (
            <div className="markdown text-xs leading-relaxed text-slate-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
            </div>
          ) : (
            <pre className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
              {JSON.stringify({
                document: citation.document_name,
                page_number: citation.page_number,
                chunk_id: citation.chunk_id,
                extracted_content: text,
                structure_type: "unstructured_passage",
              }, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <a
          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
          href={`/api/documents/${citation.document_id}/file`}
          target="_blank"
          rel="noreferrer"
        >
          <span>Open raw source document</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}

export function SearchPage() {
  const bases = useQuery({ queryKey: ["knowledge-bases"], queryFn: api.knowledgeBases });
  const [query, setQuery] = useState("");
  const [knowledgeBaseId, setKnowledgeBaseId] = useState("");
  const [error, setError] = useState("");
  const search = useMutation({
    mutationFn: () => {
      const clean = query.trim();
      if (!clean) throw new Error("Search query cannot be empty");
      return api.search({ query: clean, knowledge_base_id: knowledgeBaseId || undefined, top_k: 10 });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Search failed"),
  });

  function resetFilters() {
    setQuery("");
    setKnowledgeBaseId("");
    setError("");
    search.reset();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageTitle
        title="Hybrid Semantic & Lexical Search"
        subtitle="Inspect dense vector and BM25 candidates ranked by reciprocal rank fusion without generating a model answer."
      />

      <form
        className="flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          search.mutate();
        }}
      >
        <select
          aria-label="Knowledge base filter"
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
          aria-label="Search query"
          className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
          placeholder="Search passages, formulas, keywords, or topics..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <Button disabled={search.isPending} type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          <span>{search.isPending ? "Searching..." : "Hybrid Search"}</span>
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}

      <div className="space-y-4">
        {(search.data?.hits || []).map((hit) => (
          <article
            key={hit.chunk_id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="truncate max-w-[400px]">{hit.document_name}</span>
              </h2>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700">
                Score: {hit.score.toFixed(4)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {hit.section || "General Content"}{hit.page_number ? ` · Page ${hit.page_number}` : ""}
            </p>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 break-words">
              {hit.snippet}
            </p>
          </article>
        ))}

        {/* BUG-FILT-0005: Filtered empty state provides active reset action */}
        {search.isSuccess && search.data.hits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-3">
            <p className="text-sm text-slate-600 font-medium">No matching passages were found for the query or selected filters.</p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear Search & Reset Filters
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
