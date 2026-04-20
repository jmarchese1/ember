"use client";
import { useState } from "react";
import {
  X,
  Check,
  Sparkles,
  Loader2,
  Brain,
  Dumbbell,
  BookOpen,
  Salad,
  Infinity as InfinityIcon,
  Music,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "./ui/button";
import { toast } from "./ui/toast";

const FEATURES: { icon: React.ReactNode; title: string; body: string }[] = [
  {
    icon: <InfinityIcon size={16} />,
    title: "Unlimited AI parsing",
    body: "Free is capped at 3 logs a day. Pro never caps — write as much as your life demands.",
  },
  {
    icon: <Brain size={16} />,
    title: "Weekly cross-domain reflections",
    body: "Claude reads your training + journal + diet together and surfaces patterns: \"your mood dips after heavy push days\".",
  },
  {
    icon: <Music size={16} />,
    title: "Full meditation sound library",
    body: "Free gets silence + pink noise. Pro unlocks rain, ocean, brown noise, deep hum, and the guided box-breathing sequence.",
  },
  {
    icon: <Zap size={16} />,
    title: "Advanced exercise analytics",
    body: "Per-lift progression charts, PR alerts, volume heatmaps, and auto-detected plateaus.",
  },
  {
    icon: <Sparkles size={16} />,
    title: "Priority AI + new features first",
    body: "Faster response times, early access to community features, and every new sound/insight as we ship it.",
  },
];

export function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    try {
      const { data: sess } = await supabase().auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast("Session expired — sign in again.");
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast(json.error || "Couldn't start checkout.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 fade-in"
      style={{ background: "rgba(12, 10, 9, 0.65)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="card max-w-lg w-full max-h-[92vh] overflow-y-auto scrollbar-thin p-0 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 grid place-items-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          aria-label="close"
        >
          <X size={16} />
        </button>

        {/* Hero */}
        <div
          className="px-6 pt-8 pb-6 md:px-8 md:pt-10 md:pb-7 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-60"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 45%), radial-gradient(circle at 80% 80%, rgba(251,191,36,0.25), transparent 50%)",
            }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold mb-4" style={{ background: "rgba(255,255,255,0.18)", color: "#fff7e6" }}>
              <Sparkles size={11} />
              Ember Pro
            </div>
            <h2
              className="display text-white text-3xl md:text-4xl tracking-tight leading-[1.1] mb-3"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              The same Ember,
              <br />
              <span className="italic">finally uncapped.</span>
            </h2>
            <p className="text-[14px] leading-relaxed" style={{ color: "#fef3c7" }}>
              Start a <span className="font-semibold text-white">7-day free trial</span>.
              Cancel anytime in one click. No card drama.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="px-6 py-6 md:px-8 md:py-7 space-y-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg grid place-items-center shrink-0 mt-0.5"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary flex items-center gap-2">
                  {f.title}
                  <Check size={12} className="text-accent" />
                </div>
                <div className="text-[12.5px] text-secondary leading-snug mt-0.5">
                  {f.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Price + CTA */}
        <div
          className="px-6 py-5 md:px-8 md:py-6 border-t"
          style={{ borderColor: "var(--border-soft)", background: "var(--bg-subtle)" }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-tertiary">After trial</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span
                  className="numeric text-primary text-3xl leading-none"
                  style={{ fontVariationSettings: '"opsz" 144' }}
                >
                  $6.99
                </span>
                <span className="text-[13px] text-tertiary">/mo</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-widest text-tertiary">Today</div>
              <div className="numeric text-accent text-2xl leading-none mt-0.5">$0</div>
            </div>
          </div>
          <Button
            onClick={upgrade}
            disabled={loading}
            className="w-full !justify-center !py-3 !text-[14px]"
            icon={loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          >
            {loading ? "Opening Stripe…" : "Start my 7-day free trial"}
          </Button>
          <p className="text-[11px] text-tertiary text-center mt-3 leading-relaxed">
            Full refund within 24 hours if Pro isn't for you. We won't charge until day 8.
          </p>
        </div>

        <div className="px-6 py-4 md:px-8 flex items-center justify-center gap-6 text-[11px] text-tertiary" style={{ background: "var(--bg-card)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Dumbbell size={11} />
            Training
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={11} />
            Journal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Salad size={11} />
            Diet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Brain size={11} />
            Meditation
          </span>
        </div>
      </div>
    </div>
  );
}
