"use client";
import type { TooltipProps } from "recharts";

export function SoftTooltip({
  active,
  payload,
  label,
  unit = "",
  labelKey,
}: TooltipProps<number, string> & { unit?: string; labelKey?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl border backdrop-blur text-xs"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-soft)",
        boxShadow: "var(--shadow-md)",
        minWidth: 110,
      }}
    >
      <div className="text-[10px] uppercase tracking-widest text-tertiary mb-1">
        {labelKey ?? label}
      </div>
      {payload.map((p, i) => {
        const v = p.value;
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-secondary capitalize">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: p.color as string }}
              />
              {p.name}
            </span>
            <span className="numeric text-primary" style={{ fontSize: 13 }}>
              {v}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
