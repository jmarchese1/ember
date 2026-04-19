"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const PHASES = [
  { label: "Inhale", ms: 4000 },
  { label: "Hold", ms: 4000 },
  { label: "Exhale", ms: 4000 },
  { label: "Hold", ms: 4000 },
];

export function Breathing({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(true);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    tRef.current = window.setTimeout(() => {
      setPhase((p) => {
        const next = (p + 1) % PHASES.length;
        if (next === 0) setRound((r) => r + 1);
        return next;
      });
    }, PHASES[phase].ms);
    return () => {
      if (tRef.current) clearTimeout(tRef.current);
    };
  }, [phase, running]);

  const p = PHASES[phase];
  const scale = phase === 0 ? 1.15 : phase === 2 ? 0.85 : phase === 1 ? 1.15 : 0.85;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(12, 10, 9, 0.75)", backdropFilter: "blur(10px)" }}
    >
      <button
        onClick={onClose}
        aria-label="close"
        className="absolute top-5 right-5 btn btn-ghost !px-2.5 !py-2 fade-in"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col items-center gap-8 fade-in">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-tertiary">Box breathing</div>
          <div className="display text-primary text-2xl tracking-tight mt-1">
            4 · 4 · 4 · 4
          </div>
        </div>

        <div className="relative grid place-items-center" style={{ width: 280, height: 280 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, var(--accent-glow), transparent 70%)",
              transform: `scale(${scale})`,
              transition: "transform 3.8s cubic-bezier(0.45,0.05,0.55,0.95)",
              opacity: 0.8,
            }}
          />
          <div
            className="rounded-full grid place-items-center"
            style={{
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle at 30% 30%, var(--accent-hover), var(--accent) 70%)",
              transform: `scale(${scale})`,
              transition: "transform 3.8s cubic-bezier(0.45,0.05,0.55,0.95)",
              boxShadow: "0 20px 60px -10px var(--accent-glow)",
            }}
          >
            <span className="display text-white text-xl font-medium">{p.label}</span>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-tertiary">Round {round}</div>
          <button
            className="btn btn-ghost mt-3"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>
    </div>
  );
}
