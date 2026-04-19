"use client";
import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";

const KEY = "habits:install-hint-dismissed";

export function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hide on desktop
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (!isIOS) return;
    // Hide if already installed (standalone)
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;
    // Hide if dismissed
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {}
    // Wait a moment so it doesn't pop immediately on first paint
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  }

  return (
    <div
      className="fixed bottom-4 inset-x-4 z-40 card p-4 flex items-start gap-3 fade-in safe-bottom"
      style={{ boxShadow: "var(--shadow-lg)", maxWidth: 420, margin: "0 auto" }}
    >
      <div
        className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
        style={{ background: "var(--accent-soft)", color: "var(--accent-hover)" }}
      >
        <Plus size={16} />
      </div>
      <div className="flex-1 min-w-0 text-[13px]">
        <div className="font-semibold text-primary">Install Ember</div>
        <div className="text-secondary leading-snug mt-0.5">
          Tap{" "}
          <Share size={12} className="inline -mt-0.5" /> <b>Share</b> then{" "}
          <b>Add to Home Screen</b> — Ember opens like a native app.
        </div>
      </div>
      <button
        onClick={dismiss}
        className="text-tertiary hover:text-primary shrink-0"
        aria-label="dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
