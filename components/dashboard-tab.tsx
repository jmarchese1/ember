"use client";
import { useMemo, useState } from "react";
import { Dumbbell, BookOpen, Salad, Sparkles, Copy, RefreshCw, Flame, Check } from "lucide-react";
import { getAllLogs } from "@/lib/storage";
import { lastNDays, todayISO, formatDate } from "@/lib/utils";
import { getDailyQuote } from "@/lib/quotes";
import type { Settings, Streaks, DayLog } from "@/lib/types";
import { Card, CardHeader } from "./ui/card";
import { ProgressRing } from "./progress-ring";
import { Button } from "./ui/button";
import { StreakFlame } from "./streak-flame";
import { EmptyState } from "./empty-state";
import { DashboardIllustration } from "./empty-illustrations";
import { toast } from "./ui/toast";

export function DashboardTab({
  settings,
  streaks,
  refreshKey,
}: {
  settings: Settings;
  streaks: Streaks;
  refreshKey: number;
}) {
  const logs = useMemo<DayLog[]>(() => getAllLogs(), [refreshKey]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const last7 = lastNDays(7);
  const weekLogs = last7.map((d) => logs.find((l) => l.date === d) || { date: d });
  const workoutsThisWeek = weekLogs.filter((l) => l.workout).length;
  const journalsThisWeek = weekLogs.filter((l) => l.journal).length;
  const dietsThisWeek = weekLogs.filter((l) => l.diet).length;
  const consistencyDays = weekLogs.filter((l) => l.workout || l.journal || l.diet).length;
  const consistency = Math.round((consistencyDays / 7) * 100);

  const todayQuote = getDailyQuote(todayISO());

  async function generateSummary() {
    if (!weekLogs.some((l) => l.workout || l.journal || l.diet)) {
      toast("Log some days first — there's nothing to reflect on yet.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs: weekLogs, name: settings.name }),
      });
      const data = await res.json();
      if (data.summary) setSummary(data.summary);
      else toast(data.error || "Couldn't generate summary.");
    } catch {
      toast("Couldn't reach the AI. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(
        `Ember — Week of ${formatDate(last7[0], "short")} to ${formatDate(last7[6], "short")}\n\n${summary}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Clipboard unavailable.");
    }
  }

  if (!logs.length) {
    return (
      <EmptyState
        illustration={<DashboardIllustration />}
        title="Your dashboard is quiet"
        body="Log a day on the Home tab and your rings, streaks, and weekly reflection will bloom here."
      />
    );
  }

  const longest = Math.max(streaks.workout.current, streaks.journal.current, streaks.diet.current);

  return (
    <div className="space-y-6 rise">
      {/* Consistency header */}
      <div className="grid md:grid-cols-[1.3fr_1fr] gap-4">
        <Card>
          <CardHeader
            title="This week"
            subtitle={`${formatDate(last7[0], "short")} — ${formatDate(last7[6], "short")}`}
            right={<StreakFlame count={longest} active={longest > 0} size={22} />}
          />
          <div className="flex items-center justify-around py-2">
            <ProgressRing
              value={workoutsThisWeek}
              max={7}
              color="var(--accent)"
              label="Training"
              sublabel={`${workoutsThisWeek}/7 days`}
            />
            <ProgressRing
              value={journalsThisWeek}
              max={7}
              color="var(--accent-hover)"
              label="Journal"
              sublabel={`${journalsThisWeek}/7 days`}
            />
            <ProgressRing
              value={dietsThisWeek}
              max={7}
              color="#ea580c"
              label="Diet"
              sublabel={`${dietsThisWeek}/7 days`}
            />
          </div>
          <div className="divider" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">Overall consistency this week</span>
            <span className="numeric text-primary text-2xl">{consistency}%</span>
          </div>
          <div className="mt-2 w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${consistency}%`,
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-hover) 100%)",
              }}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-3">
          <StreakRow
            label="Training"
            icon={<Dumbbell size={14} />}
            current={streaks.workout.current}
            best={streaks.workout.best}
          />
          <StreakRow
            label="Journal"
            icon={<BookOpen size={14} />}
            current={streaks.journal.current}
            best={streaks.journal.best}
          />
          <StreakRow
            label="Diet"
            icon={<Salad size={14} />}
            current={streaks.diet.current}
            best={streaks.diet.best}
          />
        </div>
      </div>

      {/* Weekly summary */}
      <Card>
        <CardHeader
          title="Weekly reflection"
          subtitle="AI-generated from this week's logs across every domain"
          right={
            <div className="flex items-center gap-2">
              {summary && (
                <Button variant="ghost" onClick={copySummary} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
              <Button variant="soft" onClick={generateSummary} disabled={loading} icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}>
                {loading ? "Reflecting…" : summary ? "Regenerate" : "Generate"}
              </Button>
            </div>
          }
        />
        {summary ? (
          <div className="text-sm text-secondary leading-relaxed whitespace-pre-line max-w-3xl">{summary}</div>
        ) : (
          <p className="text-sm text-tertiary">
            Generate a thoughtful summary of your week. Takes a moment.
          </p>
        )}
      </Card>

      {/* Quote widget */}
      <div className="grid md:grid-cols-[1fr_1fr] gap-4">
        <Card>
          <CardHeader title="Quote of the day" />
          <p className="display text-primary text-lg leading-snug tracking-tight">"{todayQuote.text}"</p>
          <p className="text-xs uppercase tracking-[0.15em] text-tertiary mt-3">— {todayQuote.author}</p>
        </Card>
        <Card>
          <CardHeader title="Milestones" subtitle="Celebrate the quiet ones too" />
          <MilestoneList longest={longest} logsCount={logs.length} />
        </Card>
      </div>
    </div>
  );
}

function StreakRow({
  label,
  icon,
  current,
  best,
}: {
  label: string;
  icon: React.ReactNode;
  current: number;
  best: number;
}) {
  const active = current > 0;
  return (
    <div className="card p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: active ? "var(--accent-soft)" : "var(--bg-subtle)", color: active ? "var(--accent-hover)" : "var(--text-tertiary)" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-primary">{label}</div>
          <div className="text-[11px] text-tertiary">
            {active ? "burning now" : "waiting on you"}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="inline-flex items-center gap-1.5 numeric text-primary text-xl leading-none">
          <Flame size={14} className={active ? "text-accent" : "text-tertiary"} />
          {current}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-tertiary">best {best}</div>
      </div>
    </div>
  );
}

function MilestoneList({ longest, logsCount }: { longest: number; logsCount: number }) {
  const items = [
    { label: "First log", hit: logsCount >= 1 },
    { label: "7-day streak", hit: longest >= 7 },
    { label: "14-day streak", hit: longest >= 14 },
    { label: "30-day streak", hit: longest >= 30 },
    { label: "100 entries logged", hit: logsCount >= 100 },
    { label: "90-day streak", hit: longest >= 90 },
  ];
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.label}
          className="flex items-center justify-between py-2 px-3 rounded-lg"
          style={{ background: "var(--bg-subtle)" }}
        >
          <span className={`text-sm ${it.hit ? "text-primary" : "text-tertiary"}`}>{it.label}</span>
          {it.hit ? (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white" style={{ background: "var(--accent)" }}>
              <Check size={13} />
            </span>
          ) : (
            <span className="text-[11px] text-tertiary">—</span>
          )}
        </li>
      ))}
    </ul>
  );
}
