"use client";
import { Dumbbell, BookOpen, Salad } from "lucide-react";
import { useMemo } from "react";
import { getAllLogs } from "@/lib/storage";
import { lastNDays, todayISO } from "@/lib/utils";

export function WeekRibbon({ refreshKey }: { refreshKey: number }) {
  const logs = useMemo(() => getAllLogs(), [refreshKey]);
  const days = lastNDays(7);
  const today = todayISO();
  const lookup = new Map(logs.map((l) => [l.date, l]));

  return (
    <div
      className="card p-4 md:p-5 flex items-center gap-4 flex-wrap"
      style={{
        background:
          "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 70%, var(--accent-soft) 180%)",
      }}
    >
      <div className="shrink-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary">This week</div>
        <div className="display text-primary text-base tracking-tight font-medium mt-0.5">Rhythm</div>
      </div>
      <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin">
        <div className="flex items-end gap-2 md:gap-3 min-w-max">
          {days.map((d) => {
            const l = lookup.get(d);
            const w = !!l?.workout;
            const j = !!l?.journal;
            const di = !!l?.diet;
            const isToday = d === today;
            const dayName = new Date(d + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "short",
            });
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <div className="flex flex-col gap-1">
                  <Dot filled={w} icon={<Dumbbell size={9} />} />
                  <Dot filled={j} icon={<BookOpen size={9} />} />
                  <Dot filled={di} icon={<Salad size={9} />} />
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest ${
                    isToday ? "text-accent font-semibold" : "text-tertiary"
                  }`}
                >
                  {dayName.slice(0, 2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Dot({ filled, icon }: { filled: boolean; icon: React.ReactNode }) {
  return (
    <div
      className="w-5 h-5 rounded-md grid place-items-center transition-all"
      style={{
        background: filled ? "var(--accent)" : "var(--bg-subtle)",
        color: filled ? "#fff" : "var(--text-muted)",
        border: "1px solid var(--border-soft)",
        boxShadow: filled ? "0 0 0 3px var(--accent-glow)" : "none",
      }}
    >
      {icon}
    </div>
  );
}
