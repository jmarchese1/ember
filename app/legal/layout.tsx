import type { ReactNode } from "react";
import Link from "next/link";
import { Flame, ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: "var(--bg-base)",
          borderColor: "var(--border-soft)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md grid place-items-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              <Flame size={14} color="#fff" fill="#fff" />
            </div>
            <span
              className="display text-primary text-[17px] font-medium"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              Ember
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] text-tertiary hover:text-primary"
          >
            <ArrowLeft size={13} />
            Back to app
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-14">
        {children}
      </main>
      <footer className="py-8 text-center text-[10px] uppercase tracking-[0.25em] text-tertiary">
        Ember · small fires, long burns
      </footer>
    </div>
  );
}
