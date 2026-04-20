"use client";

interface SoftTooltipProps {
  active?: boolean;
  // Recharts' internal Payload type is heavily generic; widen so the `<Tooltip
  // content={...}>` spread assigns cleanly without TS friction.
  payload?: Array<{
    value?: unknown;
    name?: unknown;
    color?: string;
  }>;
  label?: unknown;
  unit?: string;
  labelKey?: string;
}

/**
 * Recharts passes tooltip content components a loosely-typed props object.
 * We accept the essentials and leave the rest loose so it slots into
 * `<Tooltip content={(props) => <SoftTooltip {...props} />} />` cleanly.
 */
export function SoftTooltip({
  active,
  payload,
  label,
  unit = "",
  labelKey,
}: SoftTooltipProps) {
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
        {labelKey ?? (typeof label === "string" || typeof label === "number" ? String(label) : "")}
      </div>
      {payload.map((p, i) => {
        const v = p.value;
        return (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-secondary capitalize">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: p.color || "var(--accent)" }}
              />
              {String(p.name ?? "")}
            </span>
            <span className="numeric text-primary" style={{ fontSize: 13 }}>
              {String(v ?? "")}
              {unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

