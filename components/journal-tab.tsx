"use client";
import { useMemo } from "react";
import { BookOpen, Flame, Heart, Sparkles, Calendar } from "lucide-react";
import { JournalIllustration } from "./empty-illustrations";
import { MoodVisual } from "./mood-visual";
import { getAllEntries } from "@/lib/storage";
import { formatDate, todayISO } from "@/lib/utils";
import type { JournalEntry, Mood, Streaks } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { Card, CardHeader } from "./ui/card";

const MOOD_META: Record<Mood, { label: string; color: string; bg: string }> = {
  bleak: { label: "bleak", color: "#57534e", bg: "#e7e5e4" },
  heavy: { label: "heavy", color: "#78716c", bg: "#e7e5e4" },
  steady: { label: "steady", color: "#d97706", bg: "#fef3c7" },
  bright: { label: "bright", color: "#ea580c", bg: "#fed7aa" },
  radiant: { label: "radiant", color: "#b45309", bg: "#fde68a" },
};

export function JournalTab({ streaks, refreshKey }: { streaks: Streaks; refreshKey: number }) {
  const entries = useMemo(() => getAllEntries("journal") as JournalEntry[], [refreshKey]);

  if (!entries.length) {
    return (
      <EmptyState
        illustration={<JournalIllustration />}
        title="No reflections yet"
        body="Tell us about your day on the Home tab. Mood, themes, and patterns will quietly surface here."
      />
    );
  }

  // Theme frequency
  const themeCount = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.themes) {
      const k = t.trim().toLowerCase();
      if (!k) continue;
      themeCount.set(k, (themeCount.get(k) || 0) + 1);
    }
  }
  const themes = [...themeCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  // "On this day" — same month-day from prior entries (not today)
  const today = todayISO();
  const [, mToday, dToday] = today.split("-");
  const onThisDay = entries.filter((e) => {
    if (e.date === today) return false;
    const [, m, d] = e.date.split("-");
    return m === mToday && d === dToday;
  });

  const gratefulCount = entries.reduce((s, e) => s + (e.gratitude?.length || 0), 0);

  return (
    <div className="space-y-6 rise">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <Stat label="Streak" value={`${streaks.journal.current}d`} icon={<Flame size={14} />} accent />
        <Stat label="Entries" value={`${entries.length}`} icon={<BookOpen size={14} />} />
        <Stat label="Gratitude noted" value={`${gratefulCount}`} icon={<Heart size={14} />} />
        <Stat label="Best run" value={`${streaks.journal.best}d`} icon={<Sparkles size={14} />} />
      </div>

      <MoodVisual entries={entries} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Recurring themes" subtitle="Surfaced from your entries" />
          {themes.length === 0 ? (
            <p className="text-sm text-tertiary">Themes will emerge as you log.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {themes.map(([name, n]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium capitalize border"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent-hover)",
                    borderColor: "transparent",
                    fontSize: 12 + Math.min(3, n - 1),
                  }}
                >
                  {name}
                  <span className="text-[10px] opacity-70">×{n}</span>
                </span>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="On this day" subtitle="Past reflections from today's date" right={<Calendar size={16} className="text-tertiary" />} />
          {onThisDay.length === 0 ? (
            <p className="text-sm text-tertiary">
              Nothing yet. In a year, this space will hold your older self.
            </p>
          ) : (
            <div className="space-y-2">
              {onThisDay.slice(0, 4).map((e) => (
                <div
                  key={e.date + e.createdAt}
                  className="p-3 rounded-lg"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
                >
                  <div className="text-[10px] uppercase tracking-widest text-tertiary">{e.date}</div>
                  <div className="text-sm text-primary mt-1 truncate">{e.title}</div>
                  <div className="text-[12px] text-secondary line-clamp-2 mt-0.5">{e.summary}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">Archive</div>
            <h2 className="display text-primary text-xl tracking-tight mt-1">Reflections</h2>
          </div>
        </div>
        <div className="space-y-3">
          {entries.map((e) => (
            <JournalCard key={e.date + e.createdAt} e={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JournalCard({ e }: { e: JournalEntry }) {
  const m = MOOD_META[e.mood];
  return (
    <div className="card p-4 md:p-5 card-hover">
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-full shrink-0 grid place-items-center"
          style={{ background: m.bg, color: m.color }}
          title={m.label}
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold">{m.label.slice(0, 3)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="display text-primary text-base tracking-tight font-medium truncate">
              {e.title}
            </span>
            <span className="text-[11px] text-tertiary">{formatDate(e.date)}</span>
            {e.energy ? (
              <span className="badge">energy {e.energy}/10</span>
            ) : null}
          </div>
          {e.summary && <p className="text-sm text-secondary leading-snug mb-2">{e.summary}</p>}
          <div className="grid sm:grid-cols-2 gap-2 mt-2">
            {e.wins.length > 0 && (
              <Section title="Wins" items={e.wins} tone="accent" />
            )}
            {e.shadows.length > 0 && <Section title="Shadows" items={e.shadows} tone="muted" />}
            {e.gratitude.length > 0 && (
              <Section title="Grateful for" items={e.gratitude} tone="accent" />
            )}
          </div>
          {e.reflection && (
            <p
              className="text-[13px] mt-3 p-3 rounded-lg italic"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-hover)",
                borderLeft: "3px solid var(--accent)",
              }}
            >
              "{e.reflection}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: "accent" | "muted" }) {
  return (
    <div>
      <div
        className="text-[10px] uppercase tracking-widest font-semibold mb-1"
        style={{ color: tone === "accent" ? "var(--accent-hover)" : "var(--text-tertiary)" }}
      >
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-[13px] text-secondary leading-snug">• {it}</li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-tertiary">
        <span className={accent ? "text-accent" : ""}>{icon}</span>
        {label}
      </div>
      <div className="numeric text-3xl mt-2 text-primary leading-none">{value}</div>
    </div>
  );
}
