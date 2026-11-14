import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Shield,
  FolderOpen,
  Globe,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/knowledge-bases", label: "Knowledge bases", icon: BookOpen },
  { to: "/documents", label: "Documents", icon: FolderOpen },
  { to: "/chat", label: "Chat & Citations", icon: MessageSquare },
  { to: "/search", label: "Hybrid Search", icon: Search },
  { to: "/explore", label: "Graph Explorer", icon: Compass },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user?.role === "ADMIN" ? [...links.slice(0, 6), { to: "/admin", label: "Admin Console", icon: Shield }, links[6]] : links;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 hidden w-64 flex-col border-r border-slate-200 bg-white z-30 md:flex shadow-xs">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <svg className="h-4 w-5 fill-slate-900" viewBox="0 0 23 17" aria-hidden="true">
              <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
              <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
              <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
              <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
            </svg>
            <div>
              <div className="text-sm font-bold tracking-wider text-slate-900">NEURAL</div>
              <div className="text-[10px] text-slate-500 font-mono">KnowledgeMesh v2.0</div>
            </div>
          </Link>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse" title="Engine Online" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200/80 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* System Health Heartbeat Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/60">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 text-xs text-slate-600 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span>Cluster Status</span>
              </span>
              <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-mono border border-emerald-200">HEALTHY</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Qdrant &bull; Neo4j &bull; Redis &bull; Postgres
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 md:px-8 backdrop-blur-md shadow-2xs">
          <div className="flex items-center gap-3 md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <svg className="h-4 w-5 fill-slate-900" viewBox="0 0 23 17">
                <path d="M8.15 0.9 L4.55 0.9 L0.5 9.3 L4.1 9.3 Z" />
                <path d="M17.0 0 L13.4 0 L6.15 16.4 L9.75 16.4 Z" />
                <path d="M22.9 0 L19.3 0 L15.0 7.6 L18.6 7.6 Z" />
                <path d="M22.6 6.9 L19.0 6.9 L14.05 16.4 L17.65 16.4 Z" />
              </svg>
              <span className="font-bold tracking-wider text-slate-900">NEURAL</span>
            </Link>
          </div>

          {/* Quick External Links & User Menu */}
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>Public Landing</span>
            </Link>

            <Link
              to="/docs"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              <span>API Docs</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            {/* Profile Info */}
            <div className="text-right">
              <div className="font-semibold text-xs sm:text-sm text-slate-900">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">{user?.role}</div>
            </div>

            <button
              className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
              aria-label="Log out"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Horizontal Navigation */}
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium",
                  isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Child Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
