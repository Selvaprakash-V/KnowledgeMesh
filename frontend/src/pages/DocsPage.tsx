import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Copy, Check, ExternalLink, Terminal } from "lucide-react";

export function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-600/15">
      {/* Docs Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>KnowledgeMesh Developer Hub</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <span>Swagger UI</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            <Link
              to="/dashboard"
              className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Docs Body */}
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Sidebar Nav */}
          <div className="space-y-6 text-sm text-slate-600 font-medium">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Getting Started</div>
              <ul className="mt-2.5 space-y-2">
                <li><a href="#quickstart" className="text-blue-600 font-bold">Quickstart Guide</a></li>
                <li><a href="#auth" className="hover:text-slate-900">Authentication & JWT</a></li>
                <li><a href="#architecture" className="hover:text-slate-900">Hybrid Retrieval Flow</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Core APIs</div>
              <ul className="mt-2.5 space-y-2">
                <li><a href="#search-api" className="hover:text-slate-900">/api/search</a></li>
                <li><a href="#chat-api" className="hover:text-slate-900">/api/chat/messages</a></li>
                <li><a href="#upload-api" className="hover:text-slate-900">/api/documents/upload</a></li>
                <li><a href="#graph-api" className="hover:text-slate-900">/api/graph/entities</a></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">SDKs & Tools</div>
              <ul className="mt-2.5 space-y-2">
                <li><a href="#python-sdk" className="hover:text-slate-900">Python Client</a></li>
                <li><a href="#docker" className="hover:text-slate-900">Docker Self-Hosting</a></li>
              </ul>
            </div>
          </div>

          {/* Main Docs Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Quickstart */}
            <section id="quickstart">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">API Quickstart</h1>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                KnowledgeMesh exposes a RESTful API built on FastAPI. All queries require a Bearer token in the <code className="text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-mono text-xs">Authorization</code> header.
              </p>

              {/* Code Snippet */}
              <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold">Bash / cURL</span>
                  </div>
                  <button
                    onClick={() => copyCode(
`curl -X POST "http://localhost:8000/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@knowledgemesh.local", "password": "Admin1234!"}'`,
                      "curl-login"
                    )}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copied === "curl-login" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied === "curl-login" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`curl -X POST "http://localhost:8000/api/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@knowledgemesh.local", "password": "Admin1234!"}'`}
                </pre>
              </div>
            </section>

            {/* Hybrid Query */}
            <section id="search-api" className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900">Hybrid Query Endpoint</h2>
              <p className="mt-2 text-sm text-slate-600">
                Execute a fused dense vector and BM25 lexical search with reranking:
              </p>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0f172a] overflow-hidden shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-400">
                  <span className="font-mono text-blue-400 font-bold">POST /api/search</span>
                  <button
                    onClick={() => copyCode(
`curl -X POST "http://localhost:8000/api/search" \\
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the core ingestion steps?",
    "knowledge_base_ids": ["86ee8f21-b493-492a-98eb-dfab00778587"],
    "top_k": 5
  }'`,
                      "curl-search"
                    )}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {copied === "curl-search" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied === "curl-search" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`curl -X POST "http://localhost:8000/api/search" \\
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the core ingestion steps?",
    "knowledge_base_ids": ["86ee8f21-b493-492a-98eb-dfab00778587"],
    "top_k": 5
  }'`}
                </pre>
              </div>

              {/* Sample Response */}
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Sample Response</div>
                <pre className="rounded-2xl border border-slate-200 bg-slate-900 p-4 font-mono text-xs text-emerald-400 overflow-x-auto shadow-xs">
{`{
  "query": "What are the core ingestion steps?",
  "results": [
    {
      "chunk_id": "c1f7a28e-5b1b-41f2-bf89-94cf1d11b15a",
      "filename": "24AD197 Selvaprakash_V-FSD Report.pdf",
      "score": 0.894,
      "source": "hybrid_reranked",
      "page_number": 4,
      "text": "The document ingestion pipeline consists of: upload -> validate -> parse -> chunk -> embed -> Qdrant..."
    }
  ],
  "latency_ms": 78.4
}`}
                </pre>
              </div>
            </section>

            {/* Python Client */}
            <section id="python-sdk" className="border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900">Python Client Integration</h2>
              <p className="mt-2 text-sm text-slate-600">
                Easily integrate KnowledgeMesh into LangChain, LlamaIndex, or your custom agent workflows:
              </p>
              <div className="mt-4 rounded-2xl border border-slate-800 bg-[#0f172a] p-4 font-mono text-xs text-slate-200 overflow-x-auto shadow-md">
{`import requests

KM_HOST = "http://localhost:8000"
TOKEN = "your-access-token"

def ask_knowledgemesh(question: str):
    response = requests.post(
        f"{KM_HOST}/api/chat/messages",
        headers={"Authorization": f"Bearer {TOKEN}"},
        json={"content": question}
    )
    data = response.json()
    print("Answer:", data["answer"])
    print("Citations:", [c["filename"] for c in data.get("citations", [])])

ask_knowledgemesh("What is the project architecture?")`}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
