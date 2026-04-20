"use client";
import { Flame, Moon, Sun, Wind, Sparkles } from "lucide-react";
import { StreakFlame } from "./streak-flame";
import type { Settings, Streaks } from "@/lib/types";

export function TopBar({
  settings,
  streaks,
  onToggleTheme,
  onOpenBreathing,
  onOpenAccount,
  onOpenStreak,
  onOpenUpgrade,
  email,
  tier,
}: {
  settings: Settings;
  streaks: Streaks;
  onToggleTheme: () => void;
  onOpenBreathing: () => void;
  onOpenAccount?: () => void;
  onOpenStreak?: () => void;
  onOpenUpgrade?: () => void;
  email?: string;
  tier?: "free" | "pro";
}) {
  const longest = Math.max(streaks.workout.current, streaks.journal.current, streaks.diet.current);
  const active = longest > 0;
  const isDark = settings.theme === "dark";
  return (
    <header className="sticky top-0 z-30 border-b" style={{ background: "var(--bg-base)", borderColor: "var(--border-soft)" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-lg grid place-items-center"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Flame size={16} color="#fff" strokeWidth={2.25} fill="#fff" />
            </div>
          </div>
          <div className="leading-none">
            <div className="display text-primary text-[20px] tracking-tight font-medium" style={{ fontVariationSettings: '"opsz" 144' }}>Ember</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary mt-0.5">
              {settings.name ? `for ${settings.name.split(" ")[0]}` : "a quiet journal"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {tier === "pro" ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "#fff",
                boxShadow: "0 4px 12px -4px var(--accent-glow)",
              }}
              title="Ember Pro"
            >
              <Sparkles size={11} />
              Pro
            </span>
          ) : onOpenUpgrade ? (
            <button
              onClick={onOpenUpgrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all hover:brightness-110 hover:-translate-y-px"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "#fff",
                boxShadow: "0 6px 18px -6px var(--accent-glow)",
              }}
              title="Upgrade to Ember Pro"
            >
              <Sparkles size={13} />
              <span>Upgrade</span>
            </button>
          ) : null}

          <button
            onClick={onOpenStreak}
            disabled={!onOpenStreak}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all hover:border-default disabled:cursor-default"
            style={{ borderColor: "var(--border-soft)", background: "var(--bg-card)" }}
            title={longest ? `${longest}-day streak — view calendar` : "No active streak"}
          >
            <StreakFlame count={longest} active={active} size={22} />
          </button>
          <button
            onClick={onOpenBreathing}
            className="btn btn-ghost !px-2.5 !py-2"
            title="Breathing exercise"
            aria-label="Breathing exercise"
          >
            <Wind size={16} />
          </button>
          <button
            onClick={onToggleTheme}
            className="btn btn-ghost !px-2.5 !py-2"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {onOpenAccount && (
            <button
              onClick={onOpenAccount}
              className="btn btn-ghost !px-2 !py-1.5"
              title={email || "Account"}
              aria-label="Account"
            >
              <div
                className="w-6 h-6 rounded-full grid place-items-center text-[11px] font-semibold"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                {initials(settings.name, email)}
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function initials(name?: string, email?: string): string {
  if (name && name.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "U";
  }
  if (email) return email[0].toUpperCase();
  return "U";
}
