"use client";
import { useMemo } from "react";
import { Salad, Flame, Sparkles, Droplets } from "lucide-react";
import { getAllEntries } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { DietEntry, DietQuality, Streaks } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { DietIllustration } from "./empty-illustrations";
import { Card, CardHeader } from "./ui/card";
import { CalendarHeatmap } from "./calendar-heatmap";
import { DietQualityVisual } from "./diet-quality-visual";

const QUALITY_META: Record<
  DietQuality,
  { label: string; color: string; bg: string; ring: string }
> = {
  poor: { label: "poor", color: "#78716c", bg: "#e7e5e4", ring: "#57534e" },
  meh: { label: "meh", color: "#a8a29e", bg: "#e7e5e4", ring: "#78716c" },
  decent: { label: "decent", color: "#d97706", bg: "#fef3c7", ring: "#f59e0b" },
  clean: { label: "clean", color: "#ea580c", bg: "#fed7aa", ring: "#ea580c" },
  nourishing: { label: "nourishing", color: "#b91c1c", bg: "#fde68a", ring: "#dc2626" },
};

export function DietTab({ streaks, refreshKey }: { streaks: Streaks; refreshKey: number }) {
  const diets = useMemo(() => getAllEntries("diet") as DietEntry[], [refreshKey]);

  if (!diets.length) {
    return (
      <EmptyState
        illustration={<DietIllustration />}
        title="No meals logged yet"
        body="Describe what you ate on the Home tab — rough is fine. We'll grade the quality and surface patterns here."
      />
    );
  }

  const byDate = new Set(diets.map((d) => d.date));
  const withQuality = diets.filter((d) => d.qualityScore > 0);
  const avgQuality = withQuality.length
    ? withQuality.reduce((s, d) => s + d.qualityScore, 0) / withQuality.length
    : 0;

  return (
    <div className="space-y-6 rise">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <Stat label="Streak" value={`${streaks.diet.current}d`} icon={<Flame size={14} />} accent />
        <Stat label="Days logged" value={`${diets.length}`} icon={<Salad size={14} />} />
        <Stat
          label="Avg quality"
          value={avgQuality ? `${avgQuality.toFixed(1)}` : "—"}
          suffix={avgQuality ? "/5" : undefined}
          icon={<Sparkles size={14} />}
        />
        <Stat label="Best run" value={`${streaks.diet.best}d`} icon={<Flame size={14} />} />
      </div>

      <DietQualityVisual entries={diets} />

      <div className="grid md:grid-cols-[2fr_1fr] gap-4">
        <div>
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">History</div>
              <h2 className="display text-primary text-xl tracking-tight mt-1">Meals by day</h2>
            </div>
          </div>
          <div className="space-y-3">
            {diets.map((d) => (
              <DietCard key={d.date + d.createdAt} d={d} />
            ))}
          </div>
        </div>
        <Card>
          <CardHeader title="Logged days" subtitle="Last 13 weeks" />
          <CalendarHeatmap datesLogged={byDate} />
        </Card>
      </div>
    </div>
  );
}

function DietCard({ d }: { d: DietEntry }) {
  const q = d.quality ? QUALITY_META[d.quality] : QUALITY_META.decent;
  return (
    <div className="card p-4 md:p-5 card-hover">
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-14 h-14 rounded-xl shrink-0 grid place-items-center"
          style={{ background: q.bg, color: q.color }}
          title={q.label}
        >
          <div className="numeric text-xl leading-none" style={{ color: q.ring }}>
            {d.qualityScore || 3}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="badge capitalize"
              style={{ background: q.bg, color: q.color, borderColor: "transparent" }}
            >
              {q.label}
            </span>
            <span className="text-[11px] text-tertiary">{formatDate(d.date)}</span>
          </div>
          {d.summary && (
            <p className="text-sm text-primary leading-snug">{d.summary}</p>
          )}
          {d.reasoning && (
            <p
              className="text-[13px] mt-2 p-3 rounded-lg italic"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-hover)",
                borderLeft: `3px solid ${q.ring}`,
              }}
            >
              "{d.reasoning}"
            </p>
          )}
        </div>
      </div>

      {d.meals.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-2 mt-4">
          {d.meals.map((m, i) => (
            <div
              key={i}
              className="rounded-lg px-3 py-2"
              style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-soft)" }}
            >
              <div className="text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
                {m.name}
              </div>
              <div className="text-sm text-secondary leading-snug">{m.items.join(", ")}</div>
            </div>
          ))}
        </div>
      )}
      {d.hydration && (
        <div className="flex items-center gap-2 mt-3 text-[12px] text-tertiary">
          <Droplets size={13} /> {d.hydration}
        </div>
      )}
      {d.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {d.tags.map((t) => (
            <span key={t} className="badge capitalize">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-tertiary">
        <span className={accent ? "text-accent" : ""}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="numeric text-3xl text-primary leading-none">{value}</span>
        {suffix && <span className="text-[11px] text-tertiary">{suffix}</span>}
      </div>
    </div>
  );
}
