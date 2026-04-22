"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { StreakFlame } from "./streak-flame";

const MILESTONE_COPY: Record<number, { title: string; body: string }> = {
  7: { title: "7-day flame", body: "A full week. The habit is alive now." },
  14: { title: "Two weeks in", body: "Momentum stops being effort and starts being identity." },
  30: { title: "30-day burn", body: "A month on — this is who you are now." },
  60: { title: "60 days steady", body: "Most people quit before here. You didn't." },
  90: { title: "90-day flame", body: "A season of showing up. This counts." },
  100: { title: "100 entries", body: "Your record speaks louder than any goal ever could." },
  180: { title: "Half a year", body: "Six months. Keep it small. Keep it lit." },
  365: { title: "A full year", body: "Small fires, long burns — you lived it." },
};

export function MilestoneBanner({
  milestone,
  onClose,
}: {
  milestone: number | null;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!milestone) return;
    setVisible(true);

    // Gentle haptic triple-tap on supported devices.
    try {
      navigator.vibrate?.([40, 80, 40, 80, 120]);
    } catch {}

    const t = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClose, 350);
    }, 5000);
    return () => window.clearTimeout(t);
  }, [milestone, onClose]);

  if (!milestone) return null;
  const copy = MILESTONE_COPY[milestone] || {
    title: `${milestone}-day flame`,
    body: "Keep it burning.",
  };

  return (
    <div
      className="fixed left-1/2 top-3 z-[60] px-4 pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "-24px"})`,
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s",
      }}
    >
      <div
        className="card flex items-center gap-3 py-3 px-4 md:px-5 pointer-events-auto min-w-[280px] max-w-[92vw]"
        style={{
          boxShadow: "var(--shadow-lg), 0 0 0 1px var(--accent-glow)",
          background:
            "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 60%, var(--accent-soft) 180%)",
          borderColor: "var(--accent)",
        }}
        role="status"
        aria-live="polite"
      >
        <StreakFlame count={milestone} active size={30} withLabel={false} />
        <div className="min-w-0 flex-1">
          <div
            className="display text-primary text-[15px] tracking-tight leading-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            {copy.title}
          </div>
          <div className="text-[12px] text-secondary leading-snug mt-0.5">{copy.body}</div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            window.setTimeout(onClose, 300);
          }}
          className="text-tertiary hover:text-primary shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
