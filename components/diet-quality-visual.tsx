"use client";
import { useMemo, useState } from "react";
import type { DietEntry, DietQuality } from "@/lib/types";
import { formatDate, lastNDays, todayISO } from "@/lib/utils";
import { Card, CardHeader } from "./ui/card";

const QUALITY_COLORS: Record<
  DietQuality,
  { fill: string; ring: string; label: string }
> = {
  poor: { fill: "#78716c", ring: "#57534e", label: "poor" },
  meh: { fill: "#a8a29e", ring: "#78716c", label: "meh" },
  decent: { fill: "#fcd34d", ring: "#f59e0b", label: "decent" },
  clean: { fill: "#f97316", ring: "#ea580c", label: "clean" },
  nourishing: { fill: "#dc2626", ring: "#b91c1c", label: "nourishing" },
};

function qualityFromScore(s: number): DietQuality {
  if (s <= 1.5) return "poor";
  if (s <= 2.5) return "meh";
  if (s <= 3.5) return "decent";
  if (s <= 4.5) return "clean";
  return "nourishing";
}

interface QPoint {
  date: string;
  entry?: DietEntry;
  score: number | null;
  quality: DietQuality | null;
}

export function DietQualityVisual({ entries }: { entries: DietEntry[] }) {
  const [range, setRange] = useState<30 | 90>(30);

  const data = useMemo<QPoint[]>(() => {
    const byDate = new Map(entries.map((e) => [e.date, e]));
    return lastNDays(range).map((d) => {
      const e = byDate.get(d);
      return {
        date: d,
        entry: e,
        score: e?.qualityScore ?? null,
        quality: e?.quality ?? null,
      };
    });
  }, [entries, range]);

  const logged = data.filter((d) => d.score != null);
  const avg = logged.length
    ? logged.reduce((s, d) => s + (d.score ?? 0), 0) / logged.length
    : 0;

  const distribution = useMemo(() => {
    const buckets: Record<DietQuality, number> = {
      poor: 0,
      meh: 0,
      decent: 0,
      clean: 0,
      nourishing: 0,
    };
    for (const d of logged) if (d.quality) buckets[d.quality]++;
    return buckets;
  }, [logged]);

  const [hover, setHover] = useState<QPoint | null>(null);

  return (
    <Card>
      <CardHeader
        title="Nutrition quality"
        subtitle={
          logged.length
            ? `${logged.length} days · avg ${avg.toFixed(1)} / 5 · hover a dot for details`
            : "Each column is a day — larger & warmer = more nourishing"
        }
        right={
          <div
            className="inline-flex rounded-lg border p-0.5 text-[11px]"
            style={{ borderColor: "var(--border-soft)", background: "var(--bg-subtle)" }}
          >
            {([30, 90] as const).map((n) => (
              <button
                key={n}
                onClick={() => setRange(n)}
                className={`px-2.5 py-1 rounded-md uppercase tracking-wider font-medium ${
                  range === n ? "text-primary" : "text-tertiary"
                }`}
                style={{
                  background: range === n ? "var(--bg-card)" : "transparent",
                  boxShadow: range === n ? "var(--shadow-sm)" : "none",
                }}
              >
                {n}d
              </button>
            ))}
          </div>
        }
      />

      <div
        className="rounded-xl p-4 relative overflow-hidden"
        style={{
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <Legend />
        <div className="relative pl-20 pr-2" style={{ height: 160 }}>
          <div className="relative h-full">
            {[5, 4, 3, 2, 1].map((v) => {
              const top = ((5 - v) / 4) * 100;
              return (
                <div
                  key={v}
                  className="absolute left-0 right-0"
                  style={{
                    top: `${top}%`,
                    borderTop: "1px dashed var(--border-soft)",
                  }}
                >
                  <span
                    className="absolute -translate-y-1/2 text-[9px] uppercase tracking-widest px-1"
                    style={{
                      right: "calc(100% + 6px)",
                      color: "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {QUALITY_COLORS[qualityFromScore(v)].label}
                  </span>
                </div>
              );
            })}

            <div className="absolute inset-0 flex gap-[2px]">
              {data.map((p) => {
                const score = p.score ?? 0;
                const top = score > 0 ? ((5 - score) / 4) * 100 : null;
                const col = p.quality ? QUALITY_COLORS[p.quality] : null;
                return (
                  <div
                    key={p.date}
                    className="relative flex-1 h-full cursor-pointer group"
                    onMouseEnter={() => setHover(p)}
                    onMouseLeave={() =>
                      setHover((h) => (h?.date === p.date ? null : h))
                    }
                  >
                    {top != null && col ? (
                      <>
                        <div
                          className="absolute left-1/2 -translate-x-1/2 w-[2px] rounded-full"
                          style={{
                            top: `${top}%`,
                            bottom: 0,
                            background: col.fill,
                            opacity: 0.25,
                          }}
                        />
                        <div
                          className="absolute rounded-full transition-transform group-hover:scale-150"
                          style={{
                            left: "50%",
                            top: `${top}%`,
                            transform: "translate(-50%, -50%)",
                            background: col.fill,
                            border: `1.5px solid ${col.ring}`,
                            width: 6 + score * 1.4,
                            height: 6 + score * 1.4,
                            boxShadow:
                              p.quality === "nourishing" || p.quality === "clean"
                                ? `0 0 10px ${col.fill}`
                                : "none",
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          bottom: 2,
                          width: 3,
                          height: 3,
                          background: "var(--text-muted)",
                          opacity: 0.4,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {hover && (
            <div
              className="absolute top-1 right-3 px-3 py-2 rounded-lg text-xs fade-in pointer-events-none"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-soft)",
                boxShadow: "var(--shadow-md)",
                minWidth: 160,
                maxWidth: 220,
              }}
            >
              <div className="text-[10px] uppercase tracking-widest text-tertiary">
                {formatDate(hover.date, "short")}
              </div>
              {hover.entry ? (
                <>
                  <div
                    className="flex items-center gap-2 mt-0.5"
                    style={{ color: QUALITY_COLORS[hover.entry.quality].ring }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: QUALITY_COLORS[hover.entry.quality].fill,
                      }}
                    />
                    <span className="capitalize font-semibold">
                      {hover.entry.quality}
                    </span>
                    <span className="numeric text-[13px] text-primary ml-auto">
                      {hover.entry.qualityScore}/5
                    </span>
                  </div>
                  {hover.entry.reasoning && (
                    <div className="text-secondary mt-1 line-clamp-3 leading-snug">
                      {hover.entry.reasoning}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-tertiary italic mt-0.5">no log</div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between text-[9px] uppercase tracking-widest text-tertiary pl-20 pr-2 mt-2">
          <span>{formatDate(data[0]?.date || "", "short")}</span>
          <span>{formatDate(todayISO(), "short")}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary mb-2">
          Distribution
        </div>
        <div className="space-y-1.5">
          {(Object.keys(QUALITY_COLORS) as DietQuality[]).reverse().map((q) => {
            const n = distribution[q];
            const pct = logged.length ? (n / logged.length) * 100 : 0;
            const c = QUALITY_COLORS[q];
            return (
              <div key={q} className="flex items-center gap-3">
                <span className="text-[11px] w-20 capitalize text-secondary">
                  {q}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(pct, n > 0 ? 4 : 0)}%`,
                      background: c.fill,
                    }}
                  />
                </div>
                <span className="text-[11px] text-tertiary w-8 text-right numeric">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function Legend() {
  return (
    <div className="absolute top-3 right-3 z-10 flex gap-1.5">
      {(["poor", "meh", "decent", "clean", "nourishing"] as DietQuality[]).map((q) => (
        <div
          key={q}
          title={q}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: QUALITY_COLORS[q].fill }}
        />
      ))}
    </div>
  );
}
