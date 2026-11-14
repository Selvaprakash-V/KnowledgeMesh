import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/90 bg-white/90 backdrop-blur-md shadow-sm shadow-slate-200/50 text-slate-900 transition-all", className)}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h2>
        {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

const tones: Record<string, string> = {
  INDEXED: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
  PROCESSING: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
  UPLOADED: "bg-blue-50 text-blue-700 border border-blue-200 font-medium",
  FAILED: "bg-red-50 text-red-700 border border-red-200 font-medium",
  ARCHIVED: "bg-slate-100 text-slate-500 border border-slate-200",
  SKIPPED: "bg-slate-100 text-slate-600 border border-slate-200",
  PRIVATE: "bg-purple-50 text-purple-700 border border-purple-200 font-medium",
  INTERNAL: "bg-sky-50 text-sky-700 border border-sky-200 font-medium",
  ADMIN: "bg-slate-900 text-white font-semibold shadow-sm",
  USER: "bg-slate-100 text-slate-700 border border-slate-200",
  KNOWLEDGE_MANAGER: "bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium",
  HELPFUL: "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide shadow-xs", tones[value] || "bg-slate-100 text-slate-700 border border-slate-200")}>
      {value}
    </span>
  );
}
