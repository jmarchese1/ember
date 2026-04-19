"use client";
import { useMemo } from "react";
import { Dumbbell, Clock, Flame, Trophy } from "lucide-react";
import { TrainingIllustration } from "./empty-illustrations";
import { ExerciseProgress } from "./exercise-progress";
import { getAllEntries } from "@/lib/storage";
import { formatDate, todayISO, daysBetween } from "@/lib/utils";
import { canonicalizeExerciseName } from "@/lib/exercise-names";
import type { WorkoutEntry, Streaks } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { Card, CardHeader } from "./ui/card";
import { CalendarHeatmap } from "./calendar-heatmap";

export function TrainingTab({ streaks, refreshKey }: { streaks: Streaks; refreshKey: number }) {
  const workouts = useMemo(
    () => getAllEntries("workout") as WorkoutEntry[],
    [refreshKey]
  );

  if (!workouts.length) {
    return (
      <EmptyState
        illustration={<TrainingIllustration />}
        title="Your first session awaits"
        body="Log a workout on the Home tab and it'll bloom into charts, PRs, and a calendar trail here."
      />
    );
  }

  const byDate = new Set(workouts.map((w) => w.date));
  const totalVolume = workouts.reduce((s, w) => s + (w.volume ?? 0), 0);
  const totalMin = workouts.reduce((s, w) => s + (w.durationMin ?? 0), 0);
  const avgPerWeek = (() => {
    if (workouts.length < 2) return workouts.length;
    const span = Math.max(1, daysBetween(workouts[workouts.length - 1].date, todayISO()));
    return Math.round((workouts.length / span) * 7 * 10) / 10;
  })();

  // PRs: find max load per exercise name
  const prMap = new Map<string, { display: string; load: number; date: string; reps?: string }>();
  for (const w of workouts) {
    for (const m of w.movements) {
      const loadNum = parseFloat((m.load || "").match(/[\d.]+/)?.[0] || "0");
      if (!loadNum || !m.name) continue;
      const display = canonicalizeExerciseName(m.name);
      const key = display.toLowerCase();
      const cur = prMap.get(key);
      if (!cur || loadNum > cur.load) {
        prMap.set(key, { display, load: loadNum, date: w.date, reps: m.reps });
      }
    }
  }
  const prs = [...prMap.values()]
    .sort((a, b) => b.load - a.load)
    .slice(0, 5);

  return (
    <div className="space-y-6 rise">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <Stat label="Streak" value={`${streaks.workout.current}d`} icon={<Flame size={14} />} accent />
        <Stat label="Sessions" value={`${workouts.length}`} icon={<Dumbbell size={14} />} />
        <Stat label="Time" value={`${Math.round(totalMin / 60)}h`} icon={<Clock size={14} />} />
        <Stat label="Per week" value={`${avgPerWeek}`} icon={<Trophy size={14} />} />
      </div>

      {/* Per-exercise progression */}
      <ExerciseProgress workouts={workouts} />

      <div className="grid md:grid-cols-2 gap-4">
        {/* PRs */}
        <Card>
          <CardHeader title="Personal records" subtitle="Top lifts detected from your logs" />
          {prs.length === 0 ? (
            <p className="text-sm text-tertiary">Log a few sessions with weights and PRs will surface here.</p>
          ) : (
            <ul className="space-y-2">
              {prs.map((p) => (
                <li
                  key={p.display}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-primary truncate">{p.display}</div>
                    <div className="text-[11px] text-tertiary">{formatDate(p.date, "short")}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-sm font-semibold display text-accent">
                      {p.load} lb
                    </div>
                    {p.reps && <div className="text-[10px] text-tertiary">× {p.reps}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader title="Last 13 weeks" subtitle="Each square is a day — filled squares are training days" />
          <CalendarHeatmap datesLogged={byDate} />
          <div className="flex items-center gap-3 text-[11px] text-tertiary mt-3">
            <span className="inline-block w-3 h-3 rounded-[3px] border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border-soft)" }} />
            quiet
            <span className="inline-block w-3 h-3 rounded-[3px] ml-3" style={{ background: "var(--accent)" }} />
            moved
          </div>
        </Card>
      </div>

      {/* Session history */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">History</div>
            <h2 className="display text-primary text-xl tracking-tight mt-1">Sessions</h2>
          </div>
          <span className="badge">{workouts.length} logged · {Math.round(totalVolume / 1000)}k lb total</span>
        </div>

        <div className="space-y-3">
          {workouts.map((w) => (
            <WorkoutCard key={w.date + w.createdAt} w={w} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkoutCard({ w }: { w: WorkoutEntry }) {
  const intensityColor: Record<string, string> = {
    easy: "var(--text-tertiary)",
    moderate: "var(--accent)",
    hard: "var(--accent-hover)",
    brutal: "#b91c1c",
  };
  return (
    <div className="card p-4 md:p-5 card-hover">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="display text-primary text-base tracking-tight font-medium truncate">
              {w.title}
            </span>
            <span className="badge capitalize">{w.discipline}</span>
            <span
              className="badge"
              style={{ color: intensityColor[w.intensity], borderColor: intensityColor[w.intensity] + "55" }}
            >
              {w.intensity}
            </span>
          </div>
          <div className="text-[11px] text-tertiary flex items-center gap-3 flex-wrap">
            <span>{formatDate(w.date)}</span>
            {w.durationMin ? <span>· {w.durationMin} min</span> : null}
            {w.volume ? <span>· {w.volume.toLocaleString()} lb volume</span> : null}
          </div>
        </div>
      </div>
      {w.summary && <p className="text-sm text-secondary mb-3 leading-snug">{w.summary}</p>}
      {w.movements.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2">
          {w.movements.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
            >
              <span className="text-primary truncate">{m.name}</span>
              <span className="text-tertiary text-[12px] shrink-0 ml-2">
                {m.sets ? `${m.sets}×` : ""}
                {m.reps || ""}
                {m.load ? ` · ${m.load}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
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
