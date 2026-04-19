"use client";
import { useMemo } from "react";
import { X, Flame, Dumbbell, BookOpen, Salad } from "lucide-react";
import { getAllLogs } from "@/lib/storage";
import { addDays, todayISO, formatDate } from "@/lib/utils";
import type { DayLog, Streaks } from "@/lib/types";

export function StreakCalendar({
  streaks,
  refreshKey,
  onClose,
}: {
  streaks: Streaks;
  refreshKey: number;
  onClose: () => void;
}) {
  const longest = Math.max(
    streaks.workout.current,
    streaks.journal.current,
    streaks.diet.current
  );
  const logs = useMemo<DayLog[]>(() => getAllLogs(), [refreshKey]);
  const lookup = useMemo(() => new Map(logs.map((l) => [l.date, l])), [logs]);
  const today = todayISO();

  // Build last 112 days (16 weeks) grid, aligned to Sunday-start columns
  const weeks = 16;
  const endDate = today;
  const startOffset = weeks * 7 - 1;

  const grid: { date: string; inMonth: boolean; log?: DayLog }[] = [];
  for (let i = startOffset; i >= 0; i--) {
    const d = addDays(endDate, -i);
    grid.push({ date: d, inMonth: true, log: lookup.get(d) });
  }

  const totalLogged = grid.filter((g) => g.log && (g.log.workout || g.log.journal || g.log.diet)).length;

  // Motivational subtitle based on streak
  const subtitle =
    longest === 0
      ? "The next log starts a new fire."
      : longest < 7
      ? "Keep going — every day builds the habit."
      : longest < 30
      ? "You're finding rhythm. Keep feeding the flame."
      : longest < 90
      ? "Serious consistency. This is who you are now."
      : "Unstoppable. Pass this on.";

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4 fade-in"
      style={{ background: "rgba(12, 10, 9, 0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full p-6 md:p-7 max-h-[90vh] overflow-y-auto scrollbar-thin relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            background: "radial-gradient(circle at 50% 0%, var(--accent-glow), transparent 55%)",
          }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                  boxShadow: "0 8px 24px -6px var(--accent-glow)",
                }}
              >
                <Flame size={22} color="#fff" fill="#fff" strokeWidth={2} />
              </div>
              <div>
                <h2 className="display text-primary text-2xl md:text-3xl tracking-tight leading-tight">
                  Your streak is{" "}
                  <span className="text-accent numeric" style={{ fontVariationSettings: '"opsz" 144' }}>
                    {longest}
                  </span>{" "}
                  day{longest === 1 ? "" : "s"}
                </h2>
                <p className="text-sm text-secondary mt-1">{subtitle} Keep going.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost !px-2.5 !py-2"
              aria-label="close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Per-category mini streaks */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <MiniStreak label="Training" icon={<Dumbbell size={13} />} cur={streaks.workout.current} best={streaks.workout.best} />
            <MiniStreak label="Journal" icon={<BookOpen size={13} />} cur={streaks.journal.current} best={streaks.journal.best} />
            <MiniStreak label="Diet" icon={<Salad size={13} />} cur={streaks.diet.current} best={streaks.diet.best} />
          </div>

          {/* Calendar */}
          <div className="rounded-xl p-4 border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-soft)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">
                Last {weeks} weeks
              </div>
              <div className="flex items-center gap-3 text-[10px] text-tertiary">
                <LegendDot style={{ background: "var(--bg-card)", border: "1px solid var(--border-soft)" }} /> none
                <LegendDot style={{ background: "var(--accent)", opacity: 0.35 }} /> 1
                <LegendDot style={{ background: "var(--accent)", opacity: 0.65 }} /> 2
                <LegendDot style={{ background: "var(--accent)" }} /> all 3
              </div>
            </div>

            <div
              className="grid grid-rows-7 grid-flow-col gap-[4px] mx-auto w-fit"
              style={{ gridAutoColumns: "min-content" }}
            >
              {grid.map((g) => {
                const l = g.log;
                const count = [l?.workout, l?.journal, l?.diet].filter(Boolean).length;
                const isToday = g.date === today;
                const bg =
                  count === 0
                    ? "var(--bg-card)"
                    : `color-mix(in srgb, var(--accent) ${30 + count * 25}%, transparent)`;
                return (
                  <div
                    key={g.date}
                    title={`${formatDate(g.date, "short")}${l ? ` — ${count} logged` : " — no logs"}`}
                    className="relative w-[18px] h-[18px] rounded-[4px] transition-all hover:scale-125 hover:z-10"
                    style={{
                      background: bg,
                      border: `1px solid ${isToday ? "var(--accent-hover)" : "var(--border-soft)"}`,
                      boxShadow: isToday ? "0 0 0 1.5px var(--accent)" : "none",
                    }}
                  >
                    {count === 3 && (
                      <div
                        className="absolute inset-0 rounded-[4px] pointer-events-none"
                        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-tertiary mt-3">
              <span>{formatDate(grid[0].date, "short")}</span>
              <span className="text-accent font-semibold">
                {totalLogged} / {grid.length} days touched
              </span>
              <span>{formatDate(today, "short")}</span>
            </div>
          </div>

          {/* Tips row */}
          <div className="mt-5 grid sm:grid-cols-2 gap-2 text-[12px]">
            <StatRow label="Today's logs" value={`${[lookup.get(today)?.workout, lookup.get(today)?.journal, lookup.get(today)?.diet].filter(Boolean).length} / 3`} />
            <StatRow label="Best streak ever" value={`${Math.max(streaks.workout.best, streaks.journal.best, streaks.diet.best)} days`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStreak({
  label,
  icon,
  cur,
  best,
}: {
  label: string;
  icon: React.ReactNode;
  cur: number;
  best: number;
}) {
  const active = cur > 0;
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        background: active ? "var(--accent-soft)" : "var(--bg-subtle)",
        borderColor: active ? "transparent" : "var(--border-soft)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest" style={{ color: active ? "var(--accent-hover)" : "var(--text-tertiary)" }}>
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className="numeric text-xl text-primary leading-none">{cur}</span>
        <span className="text-[10px] text-tertiary">/ best {best}</span>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg"
      style={{ background: "var(--bg-subtle)" }}
    >
      <span className="text-tertiary uppercase tracking-widest text-[10px]">{label}</span>
      <span className="numeric text-primary">{value}</span>
    </div>
  );
}

function LegendDot({ style }: { style: React.CSSProperties }) {
  return <span className="inline-block w-2.5 h-2.5 rounded-[3px]" style={style} />;
}
