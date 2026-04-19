"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export interface ToastMsg {
  id: number;
  title?: string;
  message: string;
  tone?: "default" | "success";
}

let nextId = 1;
type Listener = (t: ToastMsg) => void;
const listeners = new Set<Listener>();

export function toast(message: string, title?: string, tone: "default" | "success" = "success") {
  const t = { id: nextId++, title, message, tone };
  listeners.forEach((l) => l(t));
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const h: Listener = (t) => {
      setItems((cur) => [...cur, t]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), 5200);
    };
    listeners.add(h);
    return () => {
      listeners.delete(h);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto slide-in-right card max-w-sm px-4 py-3 flex items-start gap-3 shadow-lg"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="mt-0.5">
            {t.tone === "success" ? (
              <CheckCircle2 size={18} className="text-accent" />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            {t.title && <div className="text-sm font-semibold text-primary">{t.title}</div>}
            <div className="text-sm text-secondary leading-snug">{t.message}</div>
          </div>
          <button
            className="text-tertiary hover:text-primary transition-colors"
            onClick={() => setItems((cur) => cur.filter((x) => x.id !== t.id))}
            aria-label="dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
