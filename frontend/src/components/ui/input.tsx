import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-2xs transition-all duration-150 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-2xs transition-all duration-150 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-500",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
  required = false,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 flex items-center gap-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600", className)}
    >
      <span>{children}</span>
      {required ? (
        <span className="text-red-500 font-bold" title="Mandatory field">
          *
        </span>
      ) : null}
    </label>
  );
}
