"use client";

export function ProgressRing({
  value,
  max,
  size = 72,
  strokeWidth = 8,
  color = "var(--accent)",
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, max ? value / max : 0));
  const offset = c * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--bg-subtle)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="ring-draw"
            style={{
              ["--dash-total" as string]: `${c}`,
              ["--dash-target" as string]: `${offset}`,
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="numeric text-primary text-xl leading-none">{value}</span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-tertiary">{label}</div>
          {sublabel && <div className="text-[11px] text-secondary mt-0.5">{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
