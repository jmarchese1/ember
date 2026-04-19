"use client";
import { classNames } from "@/lib/utils";

export function StreakFlame({
  count,
  active,
  size = 26,
  withLabel = true,
}: {
  count: number;
  active: boolean;
  size?: number;
  withLabel?: boolean;
}) {
  const milestone = count >= 90 ? 3 : count >= 30 ? 2 : count >= 7 ? 1 : 0;
  const uid = `flame-${size}-${active ? 1 : 0}`;
  return (
    <div className="flex items-center gap-2" title={active ? `${count}-day streak` : "No active streak"}>
      <div className="relative" style={{ width: size, height: size }}>
        {active && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--accent-glow), transparent 65%)",
              filter: "blur(2px)",
              animation: "pulse-glow 2.4s ease-in-out infinite",
            }}
          />
        )}
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 36"
          className={classNames("relative", active && "flame-flicker")}
          style={{ filter: active ? "drop-shadow(0 2px 8px var(--accent-glow))" : "none" }}
        >
          <defs>
            <linearGradient id={`${uid}-outer`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active ? "#fde68a" : "#d6d3d1"} />
              <stop offset="40%" stopColor={active ? "#fbbf24" : "#a8a29e"} />
              <stop offset="100%" stopColor={active ? "#d97706" : "#78716c"} />
            </linearGradient>
            <linearGradient id={`${uid}-inner`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={active ? "#fff7e6" : "#e7e5e4"} />
              <stop offset="60%" stopColor={active ? "#fcd34d" : "#c9c5c1"} />
              <stop offset="100%" stopColor={active ? "#f59e0b" : "#a8a29e"} />
            </linearGradient>
            <radialGradient id={`${uid}-core`} cx="50%" cy="70%" r="50%">
              <stop offset="0%" stopColor="#fffbe6" stopOpacity={active ? 0.95 : 0.4} />
              <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Outer flame */}
          <path
            d="M16 2 C19 8 25 11 25 18 C25 25 21 30 16 30 C11 30 7 25 7 18 C7 15 8 13 10 12 C10.5 15 12 16 13 15 C11.5 11 14 6 16 2 Z"
            fill={`url(#${uid}-outer)`}
          />
          {/* Inner flame */}
          <path
            d="M16 8 C18 12 22 15 22 20 C22 24.5 19.5 28 16 28 C12.5 28 10 24.5 10 20 C10 18 10.5 17 11.5 16.5 C11.7 18.5 13 19 14 18 C13 15 14.5 11 16 8 Z"
            fill={`url(#${uid}-inner)`}
            opacity="0.92"
          />
          {/* Hot core */}
          <ellipse cx="16" cy="22" rx="3.5" ry="5" fill={`url(#${uid}-core)`} />
        </svg>
      </div>
      {withLabel && (
        <div className="flex flex-col leading-none">
          <span
            className={classNames(
              "numeric leading-none",
              milestone > 0 && active && "text-accent"
            )}
            style={{ fontSize: 16 }}
          >
            {count}
          </span>
          <span className="text-[9px] uppercase tracking-widest text-tertiary mt-0.5">
            day{count === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </div>
  );
}
