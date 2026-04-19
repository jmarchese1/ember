"use client";
import { Quote } from "lucide-react";
import type { Quote as QuoteType } from "@/lib/quotes";

export function QuoteCard({ quote, compact = false }: { quote: QuoteType; compact?: boolean }) {
  if (compact) {
    return (
      <div className="card p-4 flex items-start gap-3 card-hover">
        <Quote size={16} className="text-accent shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[13px] text-primary leading-snug">"{quote.text}"</p>
          <p className="text-[11px] text-tertiary mt-1.5">— {quote.author}</p>
        </div>
      </div>
    );
  }
  return (
    <div
      className="card p-6 md:p-7 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 60%, var(--accent-soft) 180%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle at 90% 10%, var(--accent-glow), transparent 50%)",
        }}
      />
      <div className="relative flex items-start gap-3">
        <Quote size={20} className="text-accent shrink-0 mt-1" />
        <div className="min-w-0">
          <p className="display text-primary text-lg md:text-xl leading-snug tracking-tight">
            "{quote.text}"
          </p>
          <p className="text-xs uppercase tracking-[0.15em] text-tertiary mt-3">— {quote.author}</p>
        </div>
      </div>
    </div>
  );
}
