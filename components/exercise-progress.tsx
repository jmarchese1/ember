"use client";
import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { ChevronDown, TrendingUp, Award } from "lucide-react";
import type { WorkoutEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { canonicalizeExerciseName } from "@/lib/exercise-names";
import { Card, CardHeader } from "./ui/card";
import { SoftTooltip } from "./chart-tooltip";

interface ExercisePoint {
  date: string;
  label: string;
  load: number;
  reps: number;
  sets: number;
  volume: number;
  notes?: string;
}

function parseLoad(s?: string): number {
  if (!s) return 0;
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}
function parseReps(s?: string): number {
  if (!s) return 0;
  const nums = (s.match(/\d+/g) || []).map(Number);
  if (!nums.length) return 0;
  return Math.max(...nums); // take the top of the range
}

export function ExerciseProgress({ workouts }: { workouts: WorkoutEntry[] }) {
  // Build map of normalized exercise name → list of points
  const byExercise = useMemo(() => {
    const m = new Map<string, { display: string; points: ExercisePoint[] }>();
    for (const w of workouts) {
      for (const mv of w.movements || []) {
        if (!mv.name) continue;
        const display = canonicalizeExerciseName(mv.name);
        const key = display.toLowerCase();
        const load = parseLoad(mv.load);
        const reps = parseReps(mv.reps);
        const sets = mv.sets ?? 0;
        if (!load && !reps && !sets) continue;
        if (!m.has(key)) m.set(key, { display, points: [] });
        m.get(key)!.points.push({
          date: w.date,
          label: formatDate(w.date, "short"),
          load,
          reps,
          sets,
          volume: sets * reps * load,
          notes: mv.notes,
        });
      }
    }
    // Sort points chronologically per exercise
    for (const v of m.values()) v.points.sort((a, b) => a.date.localeCompare(b.date));
    return m;
  }, [workouts]);

  const exerciseList = useMemo(
    () =>
      [...byExercise.entries()]
        .map(([key, v]) => ({ key, display: v.display, count: v.points.length }))
        .sort((a, b) => b.count - a.count),
    [byExercise]
  );

  const [selected, setSelected] = useState<string | null>(
    exerciseList[0]?.key ?? null
  );
  const [metric, setMetric] = useState<"load" | "volume">("load");

  // Adapt selected if list changes and current becomes invalid
  const activeKey = selected && byExercise.has(selected) ? selected : exerciseList[0]?.key ?? null;
  const current = activeKey ? byExercise.get(activeKey)! : null;

  if (!exerciseList.length) {
    return (
      <Card>
        <CardHeader
          title="Exercise progression"
          subtitle="Log a few workouts with named exercises (e.g. 'bench press 4×8 185 lb') to track progress per movement."
        />
        <div className="text-sm text-tertiary py-4 text-center">No named exercises yet.</div>
      </Card>
    );
  }

  const pts = current?.points ?? [];
  const pr = pts.length ? Math.max(...pts.map((p) => p.load)) : 0;

  // Chart data: collapse multiple sets on the same day into a single point.
  //   load  = heaviest set that day
  //   volume = sum of (sets × reps × load) across every set that day
  const chartData = (() => {
    const byDay = new Map<
      string,
      { date: string; label: string; load: number; volume: number }
    >();
    for (const p of pts) {
      const existing = byDay.get(p.date);
      if (!existing) {
        byDay.set(p.date, { date: p.date, label: p.label, load: p.load, volume: p.volume });
      } else {
        existing.load = Math.max(existing.load, p.load);
        existing.volume = existing.volume + p.volume;
      }
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  })();

  const first = chartData[0];
  const latest = chartData[chartData.length - 1];
  const delta = first && latest ? latest.load - first.load : 0;

  return (
    <Card>
      <CardHeader
        title="Exercise progression"
        subtitle="Pick a movement to see how load and volume have moved over time."
        right={
          <div className="flex items-center gap-2">
            <MetricToggle metric={metric} setMetric={setMetric} />
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <ExercisePicker
          list={exerciseList}
          activeKey={activeKey}
          setActive={setSelected}
        />
        <div className="flex items-center gap-4 flex-wrap text-[12px]">
          <Pill label="Sessions" value={`${chartData.length}`} />
          <Pill
            label="PR"
            value={pr ? `${pr} lb` : "—"}
            accent
            icon={<Award size={12} />}
          />
          {delta !== 0 && (
            <Pill
              label="Δ since first"
              value={`${delta > 0 ? "+" : ""}${delta} lb`}
              tone={delta > 0 ? "good" : "warn"}
              icon={<TrendingUp size={12} />}
            />
          )}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id="ex-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 4" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={(props) => (
                <SoftTooltip
                  {...props}
                  unit={metric === "load" ? " lb" : " lb vol"}
                />
              )}
              cursor={{ stroke: "var(--accent)", strokeOpacity: 0.35, strokeDasharray: "3 3" }}
            />
            {pr > 0 && metric === "load" && (
              <ReferenceLine
                y={pr}
                stroke="var(--accent-hover)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `PR ${pr}`,
                  position: "right",
                  fill: "var(--accent-hover)",
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey={metric}
              name={metric === "load" ? "load" : "volume"}
              stroke="var(--accent)"
              strokeWidth={2.5}
              fill="url(#ex-grad)"
              dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
              activeDot={{ r: 7, fill: "var(--accent)", stroke: "#fff", strokeWidth: 2 }}
            />
            {metric === "load" && (
              <Line
                type="monotone"
                dataKey="reps"
                name="reps"
                stroke="var(--text-secondary)"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                yAxisId={0}
                hide
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Session breakdown list */}
      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary mb-2">
          Session log
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
          {pts
            .slice()
            .reverse()
            .map((p, i) => {
              const isPr = p.load > 0 && p.load === pr;
              return (
                <div
                  key={p.date + i}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg text-[12.5px]"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <span className="text-tertiary shrink-0 w-20">{p.label}</span>
                  <span className="text-primary flex-1 ml-3 truncate">
                    {p.sets && p.reps ? `${p.sets}×${p.reps}` : p.sets ? `${p.sets}` : ""}
                    {p.load ? ` · ${p.load} lb` : ""}
                    {p.notes ? ` — ${p.notes}` : ""}
                  </span>
                  {isPr && (
                    <span className="badge badge-accent ml-2 shrink-0">
                      <Award size={10} className="mr-0.5" />
                      PR
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );
}

function ExercisePicker({
  list,
  activeKey,
  setActive,
}: {
  list: { key: string; display: string; count: number }[];
  activeKey: string | null;
  setActive: (k: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = list.find((x) => x.key === activeKey);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="btn btn-soft !py-2 !px-3.5"
      >
        <span className="display text-primary text-[15px] font-medium tracking-tight">
          {active?.display ?? "Select exercise"}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 min-w-[240px] max-h-72 overflow-y-auto scrollbar-thin z-10 card !p-1.5 fade-in"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          {list.map((x) => (
            <button
              key={x.key}
              onMouseDown={(e) => {
                e.preventDefault();
                setActive(x.key);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                x.key === activeKey ? "text-accent" : "text-primary"
              }`}
              style={{
                background: x.key === activeKey ? "var(--accent-soft)" : "transparent",
              }}
            >
              <span className="truncate">{x.display}</span>
              <span className="text-[10px] text-tertiary ml-3">{x.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricToggle({
  metric,
  setMetric,
}: {
  metric: "load" | "volume";
  setMetric: (m: "load" | "volume") => void;
}) {
  return (
    <div
      className="inline-flex rounded-lg border p-0.5 text-[11px]"
      style={{ borderColor: "var(--border-soft)", background: "var(--bg-subtle)" }}
    >
      {(["load", "volume"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMetric(m)}
          className={`px-3 py-1 rounded-md transition-all uppercase tracking-wider font-medium ${
            metric === m ? "text-primary" : "text-tertiary"
          }`}
          style={{
            background: metric === m ? "var(--bg-card)" : "transparent",
            boxShadow: metric === m ? "var(--shadow-sm)" : "none",
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function Pill({
  label,
  value,
  accent,
  tone,
  icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "good" | "warn";
  icon?: React.ReactNode;
}) {
  const color = accent
    ? "var(--accent-hover)"
    : tone === "good"
    ? "#16a34a"
    : tone === "warn"
    ? "#dc2626"
    : "var(--text-primary)";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-widest text-tertiary flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="numeric text-[14px] leading-none" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function toTitle(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
