"use client";
import type { ReactNode } from "react";

export function EmptyState({
  illustration,
  icon,
  title,
  body,
}: {
  illustration?: ReactNode;
  icon?: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-10 md:p-14 text-center fade-in overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{ background: "radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 55%)" }}
      />
      <div className="relative">
        {illustration ? (
          <div className="flex justify-center mb-4">{illustration}</div>
        ) : icon ? (
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ background: "var(--accent-soft)" }}>
            <span className="text-accent">{icon}</span>
          </div>
        ) : null}
        <h3 className="display text-primary text-2xl tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-secondary max-w-sm mx-auto leading-relaxed">{body}</p>
      </div>
    </div>
  );
}
