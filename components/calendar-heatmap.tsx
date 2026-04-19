"use client";
import { lastNDays } from "@/lib/utils";

export function CalendarHeatmap({
  datesLogged,
  weeks = 13,
  accent,
}: {
  datesLogged: Set<string>;
  weeks?: number;
  accent?: string;
}) {
  const days = weeks * 7;
  const dates = lastNDays(days);

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-rows-7 grid-flow-col gap-[3px]" style={{ gridAutoColumns: "12px" }}>
        {dates.map((d) => {
          const hit = datesLogged.has(d);
          return (
            <div
              key={d}
              title={`${d}${hit ? " — logged" : ""}`}
              className="w-3 h-3 rounded-[3px] transition-colors"
              style={{
                background: hit ? accent || "var(--accent)" : "var(--bg-subtle)",
                border: "1px solid var(--border-soft)",
                opacity: hit ? 1 : 0.7,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
