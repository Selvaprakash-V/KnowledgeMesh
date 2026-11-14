import { Navigate, Outlet, createBrowserRouter, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { LoginPage, RegisterPage } from "@/pages/AuthPages";
import { ChatPage, SearchPage } from "@/pages/ChatSearchPages";
import { DashboardPage, KnowledgeBasesPage } from "@/pages/DashboardPages";
import { AdminPage, ExplorePage, SettingsPage } from "@/pages/ExploreAdminPages";
import { DocumentsPage, KnowledgeBaseDetailPage } from "@/pages/KnowledgePages";
import { LandingPage } from "@/pages/LandingPage";
import { DocsPage } from "@/pages/DocsPage";

function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-sm text-slate-500">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Loading KnowledgeMesh account...</span>
      </div>
    </div>
  );
  if (!user) {
    const redirectUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }
  return <Outlet />;
}

function AdminOnly() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public Marketing & Documentation Routes
  { path: "/", element: <LandingPage /> },
  { path: "/docs", element: <DocsPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  // Protected Enterprise Application Routes
  {
    element: <Protected />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/knowledge-bases", element: <KnowledgeBasesPage /> },
          { path: "/knowledge-bases/:id", element: <KnowledgeBaseDetailPage /> },
          { path: "/documents", element: <DocumentsPage /> },
          { path: "/chat", element: <ChatPage /> },
          { path: "/chat/:conversationId", element: <ChatPage /> },
          { path: "/search", element: <SearchPage /> },
          { path: "/explore", element: <ExplorePage /> },
          { path: "/settings", element: <SettingsPage /> },
          { element: <AdminOnly />, children: [{ path: "/admin", element: <AdminPage /> }] },
        ],
      },
    ],
  },

  // Fallback Catch-All
  { path: "*", element: <Navigate to="/" replace /> },
]);
