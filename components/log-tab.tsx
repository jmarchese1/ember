"use client";
import { useState } from "react";
import { Dumbbell, BookOpen, Salad, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Confetti } from "./ui/confetti";
import { QuoteCard } from "./quote-card";
import { toast } from "./ui/toast";
import { saveEntry, getDayLog, markQuoteSeen } from "@/lib/storage";
import { todayISO, formatDate } from "@/lib/utils";
import { getDailyQuote, getRandomQuote } from "@/lib/quotes";
import { supabase } from "@/lib/supabase-client";
import type { Settings, Streaks, AnyEntry, WorkoutEntry, JournalEntry, DietEntry } from "@/lib/types";
import { StreakFlame } from "./streak-flame";
import { WeekRibbon } from "./week-ribbon";
import { ParsePreview } from "./parse-preview";

export function LogTab({
  settings,
  streaks,
  onLogged,
  refreshKey,
  onUpgrade,
}: {
  settings: Settings;
  streaks: Streaks;
  onLogged: () => void;
  refreshKey: number;
  onUpgrade?: () => void;
}) {
  const date = todayISO();
  const [workout, setWorkout] = useState("");
  const [journal, setJournal] = useState("");
  const [diet, setDiet] = useState("");
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [pulseKinds, setPulseKinds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{
    workout?: WorkoutEntry;
    journal?: JournalEntry;
    diet?: DietEntry;
    message?: string;
  } | null>(null);
  const today = getDayLog(date);
  const todayQuote = getDailyQuote(date);

  async function process() {
    const inputs: { kind: "workout" | "journal" | "diet"; text: string }[] = [];
    if (workout.trim()) inputs.push({ kind: "workout", text: workout });
    if (journal.trim()) inputs.push({ kind: "journal", text: journal });
    if (diet.trim()) inputs.push({ kind: "diet", text: diet });
    if (!inputs.length) {
      toast("Write something first — anything.", undefined, "default");
      return;
    }
    setLoading(true);
    try {
      const { data: sess } = await supabase().auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast("Session expired — sign in again.");
        return;
      }
      const res = await fetch("/api/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inputs, date, name: settings.name }),
      });
      const data = await res.json();
      if (res.status === 402 && data?.reason === "free_limit") {
        toast(data.message || "Daily free limit reached.", "Upgrade");
        onUpgrade?.();
        return;
      }
      if (data.entries) {
        // Open review modal instead of saving immediately
        setPreview({
          workout: data.entries.workout,
          journal: data.entries.journal,
          diet: data.entries.diet,
          message: data.message,
        });
      } else {
        toast(data.error || "Something went wrong.", undefined, "default");
      }
    } catch {
      toast("Couldn't reach the AI. Try again.", undefined, "default");
    } finally {
      setLoading(false);
    }
  }

  function commitPreview(final: {
    workout?: WorkoutEntry;
    journal?: JournalEntry;
    diet?: DietEntry;
  }) {
    const saved = new Set<string>();
    for (const k of ["workout", "journal", "diet"] as const) {
      const entry = final[k] as AnyEntry | undefined;
      if (entry) {
        saveEntry(entry);
        saved.add(k);
      }
    }
    setPulseKinds(saved);
    setTimeout(() => setPulseKinds(new Set()), 2000);

    if (saved.has("workout")) setWorkout("");
    if (saved.has("journal")) setJournal("");
    if (saved.has("diet")) setDiet("");

    const q = getRandomQuote([todayQuote.id]);
    markQuoteSeen(q.id);
    toast(preview?.message || "Saved.", "Sealed", "success");

    const longest = Math.max(
      streaks.workout.current,
      streaks.journal.current,
      streaks.diet.current
    );
    const newLongest = longest + 1;
    if ([7, 14, 30, 60, 90, 100, 180, 365].includes(newLongest)) {
      setConfetti((c) => c + 1);
    }
    setPreview(null);
    onLogged();
  }

  const totalLogs = (today.workout ? 1 : 0) + (today.journal ? 1 : 0) + (today.diet ? 1 : 0);
  const longest = Math.max(streaks.workout.current, streaks.journal.current, streaks.diet.current);

  const greeting = getGreeting();

  return (
    <div className="space-y-6 rise">
      {/* Hero masthead */}
      <section className="relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-8 md:px-10 md:py-10 border" style={{
        borderColor: "var(--border-soft)",
        background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card) 60%, var(--accent-soft) 180%)",
      }}>
        <div className="absolute inset-0 pointer-events-none opacity-70" style={{
          background: "radial-gradient(circle at 92% 8%, var(--accent-glow), transparent 55%)",
        }} />
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-50" style={{
          background: "radial-gradient(circle, rgba(234, 88, 12, 0.18), transparent 70%)",
          filter: "blur(30px)",
        }} />
        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.25em] text-tertiary">{formatDate(date)}</div>
            <h1
              className="text-primary text-3xl md:text-[40px] mt-2 leading-[1.1] font-semibold"
              style={{
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                letterSpacing: "-0.03em",
              }}
            >
              {greeting}
              {settings.name && (
                <>
                  , <span className="text-accent">{settings.name.split(" ")[0]}</span>
                </>
              )}
              .
            </h1>
            <p className="text-sm md:text-[15px] text-secondary mt-3 max-w-xl leading-relaxed">
              Write messy. Write honest. We&apos;ll shape it into clean signal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatPill label="Today" value={`${totalLogs}`} suffix="/3" />
            <StatPill label="Streak" value={longest ? `${longest}` : "—"} suffix={longest ? "d" : ""} accent={longest > 0} />
          </div>
        </div>
      </section>

      {/* Week ribbon */}
      <WeekRibbon refreshKey={refreshKey} />

      {/* Quote */}
      <QuoteCard quote={todayQuote} />

      {/* Inputs */}
      <div className="grid md:grid-cols-3 gap-4 stagger">
        <InputCard
          icon={<Dumbbell size={16} />}
          title="Training"
          hint='"4x bench 185, 3x pull-ups, 2mi run, gassed"'
          value={workout}
          setValue={setWorkout}
          logged={!!today.workout}
          pulse={pulseKinds.has("workout")}
        />
        <InputCard
          icon={<BookOpen size={16} />}
          title="Journal"
          hint='"Rough day at work, good talk with a friend tonight"'
          value={journal}
          setValue={setJournal}
          logged={!!today.journal}
          pulse={pulseKinds.has("journal")}
        />
        <InputCard
          icon={<Salad size={16} />}
          title="Diet"
          hint='"Eggs + toast, big salad w/ chicken, almonds, skipped dinner"'
          value={diet}
          setValue={setDiet}
          logged={!!today.diet}
          pulse={pulseKinds.has("diet")}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-tertiary">
          {longest > 0 ? (
            <span className="inline-flex items-center gap-2">
              <StreakFlame count={longest} active size={18} withLabel={false} />
              <span>
                {longest}-day flame · keep it burning
              </span>
            </span>
          ) : (
            "Fresh start. Your first log writes the foundation."
          )}
        </div>
        <Button
          onClick={process}
          disabled={loading || (!workout.trim() && !journal.trim() && !diet.trim())}
          icon={loading ? null : <Sparkles size={15} />}
        >
          {loading ? "Shaping…" : "Process & Log"}
        </Button>
      </div>

      <Confetti fire={confetti} />

      {preview && (
        <ParsePreview
          parsed={{
            workout: preview.workout,
            journal: preview.journal,
            diet: preview.diet,
          }}
          onCancel={() => setPreview(null)}
          onSave={commitPreview}
        />
      )}
    </div>
  );
}

function InputCard({
  icon,
  title,
  hint,
  value,
  setValue,
  logged,
  pulse,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  value: string;
  setValue: (v: string) => void;
  logged: boolean;
  pulse: boolean;
}) {
  return (
    <div
      className={`card p-4 md:p-5 transition-all ${pulse ? "pulse-glow" : ""}`}
      style={pulse ? { borderColor: "var(--accent)" } : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-accent">{icon}</span>
          <span className="text-sm font-semibold text-primary">{title}</span>
        </div>
        {logged ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-accent font-medium">
            <CheckCircle2 size={13} /> logged
          </span>
        ) : (
          <span className="text-[11px] text-tertiary">empty</span>
        )}
      </div>
      <textarea
        className="textarea scrollbar-thin"
        rows={6}
        placeholder={hint}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}

function StatPill({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="px-4 py-3 rounded-2xl border backdrop-blur"
      style={{
        borderColor: "var(--border-soft)",
        background: accent
          ? "linear-gradient(135deg, var(--bg-card), var(--accent-soft))"
          : "var(--bg-card)",
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary leading-none">{label}</div>
      <div className="mt-1.5 flex items-baseline gap-0.5">
        <span className="numeric text-2xl text-primary leading-none">{value}</span>
        {suffix && <span className="text-[11px] text-tertiary leading-none">{suffix}</span>}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still awake";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late hours";
}
