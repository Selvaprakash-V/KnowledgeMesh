import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Database,
  Network,
  Shield,
  Zap,
  FileText,
  Lock,
  Cpu,
  BarChart3,
  Terminal
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"hybrid" | "graph" | "security">("hybrid");
  const [calcDocs, setCalcDocs] = useState<number>(25000);
  const [calcQueries, setCalcQueries] = useState<number>(150000);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync reduced motion with video playback
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const v = videoRef.current;
    if (!v) return;

    function sync() {
      if (!v) return;
      if (q.matches) {
        v.pause();
      } else {
        const p = v.play();
        if (p) p.catch(() => {});
      }
    }
    sync();
    if (q.addEventListener) {
      q.addEventListener("change", sync);
      return () => q.removeEventListener("change", sync);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-600/15 selection:text-blue-900 font-sans">
      {/* =========================================================================
          HERO SECTION — LUMINOUS LIGHT THEME WITH GOLD/BLUE LIGHT SHIMMER
          ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden border-b border-slate-200/80 bg-white">
        {/* Looping video background with light crystalline luminosity */}
        <video
          ref={videoRef}
          className="art absolute inset-0 h-full w-full object-cover object-center pointer-events-none z-0 opacity-40 mix-blend-multiply"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/130837c4-0244-4f37-9c61-8d801d93fd29.jpg"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260912_104303_0c6d60b2-9353-408e-9449-585108a22fb5.mp4"
        />

        {/* Ambient Light Veil Gradient for High Contrast Readability */}
        <div
          className="veil absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(140% 60% at 50% 40%, rgba(255,255,255,0.85) 0%, rgba(248,250,252,0.92) 55%, rgba(241,245,249,0.98) 100%),
                         linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.95) 100%)`
          }}
        />

        {/* Top Header Navigation Bar */}
        <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-12">
          {/* Brand Logo */}
          <Link to="/" className="group flex items-center gap-3 text-slate-900 transition-opacity hover:opacity-90">
            <svg className="h-[18px] w-[24px] fill-slate-900 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 23 17" aria-hidden="true">
              <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
              <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
              <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
              <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
            </svg>
            <span className="font-bold tracking-[0.25em] text-lg text-slate-900">NEURAL</span>
            <span className="hidden sm:inline-block rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-blue-700 shadow-2xs">
              GraphRAG 2.0
            </span>
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#platform" className="transition-colors hover:text-blue-600">Platform</a>
            <a href="#architecture" className="transition-colors hover:text-blue-600">Architecture</a>
            <a href="#solutions" className="transition-colors hover:text-blue-600">Solutions</a>
            <a href="#pricing" className="transition-colors hover:text-blue-600">Pricing</a>
            <Link to="/docs" className="transition-colors hover:text-blue-600">Docs</Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                <span>Console</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-full border border-slate-300 bg-white/90 px-5 py-2 text-sm font-semibold text-slate-800 shadow-xs backdrop-blur-md transition-all hover:border-slate-400 hover:bg-white hover:shadow-sm"
                >
                  Request access
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Headline & Content */}
        <div className="relative z-10 mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-6 text-center py-16 md:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs backdrop-blur-md mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Hybrid GraphRAG Engine with Qdrant + Neo4j</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-slate-900 leading-[1.08] max-w-4xl">
            <span className="block font-normal">World-Class Digital Products</span>
            <span className="block bg-gradient-to-r from-blue-700 via-indigo-600 to-amber-600 bg-clip-text text-transparent font-medium mt-1">
              Work on Time, Right on Target.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-slate-600 font-normal leading-relaxed">
            We build extraordinary knowledge intelligence for ambitious teams.
            Deterministic document indexing, graph reasoning, and zero-hallucination citations.
          </p>

          {/* Premium Light CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="group relative inline-flex items-center gap-3 rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{user ? "Open KnowledgeMesh Console" : "Get started today"}</span>
              <svg className="h-3.5 w-4 fill-none stroke-current stroke-[2.5] transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 16 11" aria-hidden="true">
                <path d="M0 5.5 H14.6 M10.3 1.2 L14.9 5.5 L10.3 9.8" />
              </svg>
            </Link>

            <a
              href="#platform"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-6 py-4 text-sm font-semibold text-slate-700 shadow-xs backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 hover:border-slate-400"
            >
              <span>Explore Architecture</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {/* Pillars List */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
              <svg className="h-3 w-2 stroke-blue-600 fill-none stroke-[2.5]" viewBox="0 0 11 20"><path d="M1.15 1.15 L9.6 10 L1.15 18.85" /></svg>
              <span>Strategic Partner</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
              <svg className="h-3 w-2 stroke-blue-600 fill-none stroke-[2.5]" viewBox="0 0 11 20"><path d="M1.15 1.15 L9.6 10 L1.15 18.85" /></svg>
              <span>End-to-End Delivery</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
              <svg className="h-3 w-2 stroke-blue-600 fill-none stroke-[2.5]" viewBox="0 0 11 20"><path d="M1.15 1.15 L9.6 10 L1.15 18.85" /></svg>
              <span>Deterministic Citations</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
              <svg className="h-3 w-2 stroke-blue-600 fill-none stroke-[2.5]" viewBox="0 0 11 20"><path d="M1.15 1.15 L9.6 10 L1.15 18.85" /></svg>
              <span>Enterprise Grade Security</span>
            </div>
          </div>
        </div>

        {/* Minimal Hero Bottom Strip */}
        <div className="relative z-10 border-t border-slate-200/80 bg-white/80 py-4 px-6 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-700 font-semibold">SOC2 Type II & HIPAA Ready Enterprise RBAC Isolation</span>
            </span>
            <div className="flex items-center gap-6">
              <span>Trusted by innovative teams around the world</span>
              <span className="text-slate-400">&copy; 2026 NEURAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          LIVE PLATFORM DEMO & GRAPH VISUALIZATION (LIGHT THEME)
          ========================================================================= */}
      <section id="platform" className="relative py-28 px-6 md:px-12 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 uppercase tracking-widest shadow-2xs">
              Live Engine Architecture
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-light tracking-tight text-slate-900">
              The Next Evolution Beyond <span className="font-semibold text-blue-600">Naive RAG</span>
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg">
              Generic vector search misses complex entity relations, multi-hop facts, and strict permission boundaries.
              KnowledgeMesh fuses vector embeddings, BM25 lexical search, and Neo4j graph traversal with second-stage reranking.
            </p>
          </div>

          {/* Interactive Showcase Tabs */}
          <div className="mt-12 flex justify-center gap-2 p-1.5 rounded-full bg-white border border-slate-200 shadow-xs max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("hybrid")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                activeTab === "hybrid" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hybrid Retrieval
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                activeTab === "graph" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Knowledge Graph
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                activeTab === "security" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Zero-Trust Security
            </button>
          </div>

          {/* Tab View Container */}
          <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl shadow-slate-200/50">
            {activeTab === "hybrid" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                    <Zap className="h-4 w-4" />
                    <span>Reciprocal Rank Fusion (RRF)</span>
                  </div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                    Dense Semantic + Exact Lexical Match
                  </h3>
                  <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                    Vectors capture abstract semantics while BM25 locks onto exact product codes, acronyms, and part numbers.
                    Our reciprocal rank fusion combines both score vectors before sending candidates to the cross-encoder reranker.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Qdrant vector similarity for high-dimensional semantic search</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>BM25 term frequency precision for domain-specific terminology</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Dynamic top-k reranker filters noise down to verified chunk citations</span>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Link
                      to="/search"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30"
                    >
                      <span>Try Hybrid Search in Console</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Visual Simulation Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 font-mono text-xs text-slate-300 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-slate-400">
                    <span className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-blue-400" />
                      <span>retrieval_pipeline.py</span>
                    </span>
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">200 OK — 18ms</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="text-slate-400">// 1. Dense Semantic (Qdrant)</div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-emerald-300">
                      hits = vector_store.search(query_vec, k=20) ➔ 14 matches (score: 0.892)
                    </div>
                    <div className="text-slate-400">// 2. Lexical Inverted Index (BM25)</div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-sky-300">
                      keyword_hits = bm25_rank(chunks, terms, k=20) ➔ 8 exact matches
                    </div>
                    <div className="text-slate-400">// 3. Reciprocal Rank Fusion & Rerank</div>
                    <div className="rounded-lg bg-slate-950 p-3 border border-blue-500/40 text-amber-300">
                      fused = fuse_results(vector_hits, keyword_hits, k=60)
                      <br />
                      reranked = bge_rerank(fused, top_k=4) ➔ Verified chunks [1, 3, 7]
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "graph" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600">
                    <Network className="h-4 w-4" />
                    <span>Neo4j Graph Database</span>
                  </div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                    Multi-Hop Reasoning Across Documents
                  </h3>
                  <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                    When answers depend on relationships (e.g., "Which vendors are impacted by Policy Update B?"),
                    vector search fails because the connection spans separate documents. Our entity extraction maps nodes and edges into Neo4j for 2-hop traversals.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Automatic entity-relation extraction on document upload</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Cypher graph queries execute in parallel with vector retrieval</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Graph facts provide grounded truth nodes that prevent hallucinations</span>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Link
                      to="/explore"
                      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition-all shadow-md shadow-purple-600/30"
                    >
                      <span>Explore Knowledge Graph</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Graph Visualization Mockup */}
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 h-72 flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="relative flex items-center justify-center gap-10 text-center">
                    <div className="rounded-xl border border-purple-200 bg-white p-4 shadow-md">
                      <Database className="h-6 w-6 text-purple-600 mx-auto" />
                      <div className="mt-2 text-xs font-bold text-slate-900">Entity: FSD Report</div>
                      <div className="text-[10px] text-purple-600 font-medium">Document Chunk</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">HAS_REQUIREMENT</span>
                      <div className="h-0.5 w-16 bg-gradient-to-r from-purple-500 to-blue-500 my-1" />
                      <span className="text-[9px] text-emerald-600 font-mono font-bold">Weight: 0.98</span>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-md">
                      <Cpu className="h-6 w-6 text-blue-600 mx-auto" />
                      <div className="mt-2 text-xs font-bold text-slate-900">Entity: FastAPI + Celery</div>
                      <div className="text-[10px] text-blue-600 font-medium">Architecture Component</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="grid gap-8 lg:grid-cols-2 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                    <Shield className="h-4 w-4" />
                    <span>Pre-Retrieval Authorization</span>
                  </div>
                  <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
                    Zero Cross-Tenant Leakage Guarantee
                  </h3>
                  <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                    Most RAG systems filter permissions after generating answers. KnowledgeMesh enforces document-level permissions
                    directly at the database filter level. Chunks from unauthorized documents never touch the embedding query or LLM context window.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-700 font-medium">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Role-based access control (Admin, Knowledge Manager, User)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Workspace isolation with Private, Internal, and Public tiers</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Audit logging records every document inspection and query event</span>
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/30"
                    >
                      <span>View Security Controls</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Security Diagram Card */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-3 text-xs shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-bold text-slate-800">Pre-Retrieval Enforcement Flow</span>
                    <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">100% Enforced</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 font-medium">
                    <Lock className="h-4 w-4 shrink-0 text-red-600" />
                    <span>Unauthorized Documents Filtered in SQL & Qdrant Payload Filter</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Evidence Block Assembled Exclusively from Permitted Workspaces</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Exact Source Citations [1][2] Mapped with Verifiable Hashes</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY NUMBERS & ENTERPRISE BENCHMARKS (LIGHT THEME)
          ========================================================================= */}
      <section className="py-20 border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div className="p-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-blue-600">
                99.8%
              </div>
              <div className="mt-2 text-sm text-slate-800 font-semibold">Citation Accuracy</div>
              <p className="mt-1 text-xs text-slate-500">Zero unsupported claims</p>
            </div>
            <div className="p-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-600">
                &lt; 85ms
              </div>
              <div className="mt-2 text-sm text-slate-800 font-semibold">Hybrid Retrieval Latency</div>
              <p className="mt-1 text-xs text-slate-500">RRF + BM25 + Qdrant</p>
            </div>
            <div className="p-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-emerald-600">
                10M+
              </div>
              <div className="mt-2 text-sm text-slate-800 font-semibold">Indexed Chunks Capacity</div>
              <p className="mt-1 text-xs text-slate-500">Horizontal Celery scaling</p>
            </div>
            <div className="p-4">
              <div className="text-4xl sm:text-5xl font-extrabold text-purple-600">
                0%
              </div>
              <div className="mt-2 text-sm text-slate-800 font-semibold">Cross-Tenant Leakage</div>
              <p className="mt-1 text-xs text-slate-500">Strict RBAC filtering</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ENTERPRISE SOLUTIONS BY INDUSTRY (LIGHT THEME)
          ========================================================================= */}
      <section id="solutions" className="py-28 px-6 md:px-12 bg-[#f8fafc]">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 uppercase tracking-widest shadow-2xs">
              Built for Scale
            </div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-light text-slate-900">
              Enterprise Solutions for High-Stakes Operations
            </h2>
            <p className="mt-4 text-slate-600">
              When a hallucinated clause or missing contract relation costs millions, organizations rely on KnowledgeMesh.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-xs">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Legal & Compliance Discovery</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Parse 10,000+ page M&A agreements, cross-reference clauses, and extract liability chains with verifiable paragraph citations.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 text-xs font-medium text-slate-500">
                Key capability: Multi-document graph synthesis
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-xs">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Financial & Risk Intelligence</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Fuse quarterly 10-K filings, earnings calls, and debt covenants into a structured knowledge mesh for instant portfolio risk modeling.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 text-xs font-medium text-slate-500">
                Key capability: Exact financial table chunking
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-xs">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">BioTech & R&D Knowledge Bases</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Connect clinical research trials, chemical formulas, and patent databases into a queryable graph with strict IP privacy controls.
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 text-xs font-medium text-slate-500">
                Key capability: Neo4j relationship traversal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PRICING & ROI CALCULATOR (LIGHT THEME)
          ========================================================================= */}
      <section id="pricing" className="py-28 px-6 md:px-12 bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 uppercase tracking-widest shadow-2xs">
              Transparent Enterprise Licensing
            </div>
            <h2 className="mt-4 text-3xl sm:text-5xl font-light text-slate-900">
              Predictable Pricing, <span className="font-semibold text-emerald-600">Zero Overage Surprises</span>
            </h2>
            <p className="mt-4 text-slate-600 text-base">
              Run on your private cloud, on-premises VPC, or fully managed high-availability clusters.
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Starter */}
            <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-8 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Developer / Pilot</h3>
                <p className="mt-2 text-sm text-slate-600">For teams proving GraphRAG value on local workstations.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900">$0</span>
                  <span className="text-sm text-slate-500 font-medium">/ forever open source</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Up to 100 documents</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Docker Compose standalone deployment</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Local Sentence-Transformers embeddings</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>FastAPI Swagger docs & API access</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="block w-full text-center rounded-xl border border-slate-300 bg-white py-3.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 transition-colors"
                >
                  Start Free
                </Link>
              </div>
            </div>

            {/* Growth — Featured */}
            <div className="rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-xl shadow-blue-600/10 relative flex flex-col justify-between">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Scale & Production</h3>
                <p className="mt-2 text-sm text-slate-600">For growth companies with active document pipelines and team workspaces.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900">$499</span>
                  <span className="text-sm text-slate-500 font-medium">/ month</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Up to 25,000 documents (5M chunks)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Celery asynchronous distributed worker nodes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Neo4j entity graph automatic construction</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Multi-provider LLM routing (Groq, OpenAI, Gemini)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>Priority email & Slack engineering support</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="block w-full text-center rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/30"
                >
                  Deploy Growth Cluster
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-8 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enterprise Dedicated</h3>
                <p className="mt-2 text-sm text-slate-600">For Fortune 500 & regulated organizations requiring private VPC deployment.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-slate-900">$2,499</span>
                  <span className="text-sm text-slate-500 font-medium">/ month or custom</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Unlimited documents & knowledge bases</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Air-gapped on-premise or AWS/GCP/Azure GovCloud</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Custom fine-tuned embeddings & reranker models</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>99.99% uptime SLA & dedicated solution architect</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Complete audit log exports & compliance reporting</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <a
                  href="mailto:enterprise@knowledgemesh.local?subject=Enterprise%20VPC%20Inquiry"
                  className="block w-full text-center rounded-xl border border-amber-300 bg-amber-50 py-3.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs"
                >
                  Contact Sales & Security Team
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Cost & ROI Calculator */}
          <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 max-w-4xl mx-auto shadow-md">
            <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span>Interactive Enterprise ROI Calculator</span>
            </h4>
            <p className="mt-1 text-sm text-slate-600">
              Estimate your monthly tokens and compute savings compared to naive brute-force LLM context loading.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Indexed Documents: {calcDocs.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={calcDocs}
                  onChange={(e) => setCalcDocs(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Monthly Knowledge Queries: {calcQueries.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="10000"
                  max="1000000"
                  step="10000"
                  value={calcQueries}
                  onChange={(e) => setCalcQueries(Number(e.target.value))}
                  className="mt-2 w-full accent-blue-600"
                />
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 font-medium">Estimated LLM Context Savings</div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  ${Math.round((calcQueries * 0.045)).toLocaleString()} <span className="text-sm font-semibold text-slate-500">/ month</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">Target Response Latency</div>
                <div className="text-3xl font-extrabold text-blue-600">&lt; 120 ms</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ SECTION (LIGHT THEME)
          ========================================================================= */}
      <section className="py-24 px-6 md:px-12 bg-[#f8fafc]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-light text-slate-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-600 text-sm">Everything you need to know about KnowledgeMesh Hybrid GraphRAG.</p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "How does KnowledgeMesh prevent LLM hallucinations?",
                a: "KnowledgeMesh never feeds raw guesses to the model. The retrieval pipeline enforces that citations must map to indexed chunks. If the retrieved evidence score does not satisfy the confidence threshold, the model answers with a deterministic message: 'I couldn't find enough information in the available knowledge base to answer this reliably.'"
              },
              {
                q: "Can I bring my own embedding and LLM providers?",
                a: "Yes. In your .env file or admin settings, you can switch providers with zero code modifications: Groq, OpenAI, Google Gemini, Anthropic, Ollama, or local Sentence-Transformers."
              },
              {
                q: "How does document authorization work before retrieval?",
                a: "Every document belongs to a Knowledge Base with designated visibility (Private, Internal, or Admin). When a user submits a query, SQL and Qdrant filters remove unauthorized chunks before similarity search occurs. No unauthorized text is ever retrieved or seen by the LLM."
              },
              {
                q: "What file formats can be uploaded?",
                a: "KnowledgeMesh supports PDF (PyMuPDF with layout analysis), DOCX, TXT, Markdown, CSV, and JSON documents. Large documents are automatically split into overlapping semantic chunks with SHA-256 integrity checksums."
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-colors hover:border-slate-300"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-slate-900"
                >
                  <span>{item.q}</span>
                  <ChevronRight
                    className={`h-4 w-4 text-slate-400 transition-transform ${faqOpen === idx ? "rotate-90 text-blue-600" : ""}`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION BANNER (LIGHT THEME)
          ========================================================================= */}
      <section className="relative py-24 px-6 md:px-12 border-t border-slate-200 bg-gradient-to-b from-white to-blue-50/50 text-center overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight">
            Ready to Build With <span className="font-semibold text-blue-600">Verifiable Knowledge?</span>
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg">
            Deploy in minutes with Docker Compose or connect your enterprise document pipelines today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to={user ? "/dashboard" : "/register"}
              className="rounded-full bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
              Launch KnowledgeMesh Console
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          GLOBAL FOOTER (LIGHT THEME)
          ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white py-12 px-6 md:px-12 text-sm text-slate-600">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg className="h-4 w-5 fill-slate-900" viewBox="0 0 23 17">
              <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
              <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
              <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
              <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
            </svg>
            <span className="font-bold tracking-widest text-slate-900">NEURAL</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-medium">KnowledgeMesh Enterprise Platform</span>
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-semibold text-slate-600">
            <Link to="/docs" className="hover:text-blue-600 transition-colors">Documentation</Link>
            <a href="#platform" className="hover:text-blue-600 transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">Console</Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">Log In</Link>
          </div>
          <div className="text-xs text-slate-400">
            &copy; 2026 Neural Studio Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
