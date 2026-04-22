"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  Play,
  Square,
  Volume2,
  VolumeX,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import {
  Area,
  Line,
  ComposedChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { MeditationSession, MeditationSound } from "@/lib/types";
import {
  getAllMeditations,
  saveMeditation,
  updateMeditationGuess,
} from "@/lib/storage";
import { todayISO, formatDate } from "@/lib/utils";
import { AmbientPlayer, SOUND_META, WakeKeeper } from "@/lib/meditation-sounds";
import { Card, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { SoftTooltip } from "./chart-tooltip";
import { EmptyState } from "./empty-state";

type Phase = "idle" | "running" | "guessing" | "revealed";

const FREE_SOUNDS: MeditationSound[] = ["silent", "pink"];

export function MeditationTab({
  refreshKey,
  tier = "free",
  onUpgrade,
}: {
  refreshKey: number;
  tier?: "free" | "pro";
  onUpgrade?: () => void;
}) {
  const [sessions, setSessions] = useState<MeditationSession[]>(() =>
    getAllMeditations()
  );

  // Re-read on external refresh (hydrate, login)
  useEffect(() => {
    setSessions(getAllMeditations());
  }, [refreshKey]);

  // Settings
  const [minMin, setMinMin] = useState(5);
  const [maxMin, setMaxMin] = useState(15);
  const [sound, setSound] = useState<MeditationSound>("rain");
  const [volume, setVolume] = useState(0.5);

  // Session state
  const [phase, setPhase] = useState<Phase>("idle");
  const [activeSession, setActiveSession] = useState<MeditationSession | null>(null);
  const [guessMin, setGuessMin] = useState<number | "">("");
  const [elapsedTick, setElapsedTick] = useState(0); // drives the breathing animation only

  const playerRef = useRef<AmbientPlayer | null>(null);
  const wakeRef = useRef<WakeKeeper | null>(null);
  const endTimerRef = useRef<number | null>(null);
  const breathTickRef = useRef<number | null>(null);

  useEffect(() => {
    playerRef.current = new AmbientPlayer();
    wakeRef.current = new WakeKeeper();
    return () => {
      playerRef.current?.stop();
      void wakeRef.current?.release();
      if (endTimerRef.current) window.clearTimeout(endTimerRef.current);
      if (breathTickRef.current) window.clearInterval(breathTickRef.current);
    };
  }, []);

  useEffect(() => {
    playerRef.current?.setVolume(volume);
  }, [volume]);

  async function start() {
    if (minMin < 1 || maxMin < minMin) return;
    const minSec = minMin * 60;
    const maxSec = maxMin * 60;
    const actualSec = Math.round(minSec + Math.random() * (maxSec - minSec));

    const session: MeditationSession = {
      id: makeId(),
      date: todayISO(),
      startedAt: Date.now(),
      minSec,
      maxSec,
      actualSec,
      sound,
    };

    // Acquire wake lock + unlock audio synchronously inside the click.
    void wakeRef.current?.acquire();
    await playerRef.current?.unlock();

    // Play a short start chime so the session has a clear audible threshold.
    void playerRef.current?.chime();

    // Start ambient after the chime has begun (so both are audible)
    setTimeout(() => {
      void playerRef.current?.play(sound);
    }, 800);

    setActiveSession(session);
    setGuessMin("");
    setPhase("running");

    endTimerRef.current = window.setTimeout(() => endSession(session), actualSec * 1000);

    breathTickRef.current = window.setInterval(() => {
      setElapsedTick((t) => t + 1);
    }, 800);
  }

  async function endSession(session: MeditationSession) {
    if (breathTickRef.current) {
      window.clearInterval(breathTickRef.current);
      breathTickRef.current = null;
    }
    playerRef.current?.stop();
    void wakeRef.current?.release();
    // A loud ending chime after the ambient fades
    setTimeout(() => {
      void playerRef.current?.chime();
    }, 700);

    saveMeditation(session);
    setSessions((arr) => [...arr, session]);
    setPhase("guessing");
  }

  function stopEarly() {
    if (endTimerRef.current) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (breathTickRef.current) {
      window.clearInterval(breathTickRef.current);
      breathTickRef.current = null;
    }
    playerRef.current?.stop();
    void wakeRef.current?.release();
    setActiveSession(null);
    setPhase("idle");
  }

  function submitGuess() {
    if (!activeSession) return;
    const g = typeof guessMin === "number" ? guessMin : parseFloat(String(guessMin));
    if (!Number.isFinite(g) || g < 0) return;
    const guessSec = Math.round(g * 60);
    updateMeditationGuess(activeSession.id, guessSec);
    const updated = { ...activeSession, guessSec };
    setActiveSession(updated);
    setSessions((arr) =>
      arr.map((s) => (s.id === updated.id ? updated : s))
    );
    setPhase("revealed");
  }

  function reset() {
    setActiveSession(null);
    setPhase("idle");
    setGuessMin("");
  }

  const finished = useMemo(
    () => sessions.filter((s) => typeof s.guessSec === "number"),
    [sessions]
  );

  return (
    <div className="space-y-6 rise">
      {phase === "idle" && (
        <SetupCard
          minMin={minMin}
          maxMin={maxMin}
          setMin={setMinMin}
          setMax={setMaxMin}
          sound={sound}
          setSound={setSound}
          volume={volume}
          setVolume={setVolume}
          onStart={start}
          tier={tier}
          onUpgrade={onUpgrade}
        />
      )}

      {phase === "running" && activeSession && (
        <RunningCard
          sound={activeSession.sound ?? "silent"}
          tick={elapsedTick}
          onStop={stopEarly}
          volume={volume}
          setVolume={setVolume}
        />
      )}

      {phase === "guessing" && activeSession && (
        <GuessCard
          session={activeSession}
          guessMin={guessMin}
          setGuessMin={setGuessMin}
          onSubmit={submitGuess}
        />
      )}

      {phase === "revealed" && activeSession && (
        <RevealCard session={activeSession} onDone={reset} />
      )}

      <ProgressGraph sessions={finished} />
    </div>
  );
}

/* ================= Setup ================= */

function SetupCard({
  minMin,
  maxMin,
  setMin,
  setMax,
  sound,
  setSound,
  volume,
  setVolume,
  onStart,
  tier,
  onUpgrade,
}: {
  minMin: number;
  maxMin: number;
  setMin: (n: number) => void;
  setMax: (n: number) => void;
  sound: MeditationSound;
  setSound: (s: MeditationSound) => void;
  volume: number;
  setVolume: (v: number) => void;
  onStart: () => void;
  tier: "free" | "pro";
  onUpgrade?: () => void;
}) {
  const [soundOpen, setSoundOpen] = useState(false);
  const [preview, setPreview] = useState<AmbientPlayer | null>(null);
  const [teasingSound, setTeasingSound] = useState<MeditationSound | null>(null);
  const teaseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      preview?.stop();
      if (teaseTimerRef.current) window.clearTimeout(teaseTimerRef.current);
    };
  }, [preview]);

  async function previewSound(s: MeditationSound) {
    setSound(s);
    let p = preview;
    if (!p) {
      p = new AmbientPlayer();
      setPreview(p);
    }
    await p.unlock();
    p.setVolume(volume);
    await p.play(s);
  }

  async function teaseLockedSound(s: MeditationSound) {
    let p = preview;
    if (!p) {
      p = new AmbientPlayer();
      setPreview(p);
    }
    await p.unlock();
    p.setVolume(volume);
    await p.play(s);
    setTeasingSound(s);
    if (teaseTimerRef.current) window.clearTimeout(teaseTimerRef.current);
    teaseTimerRef.current = window.setTimeout(() => {
      p?.stop();
      setTeasingSound(null);
    }, 3000);
  }

  function stopPreview() {
    preview?.stop();
    if (teaseTimerRef.current) {
      window.clearTimeout(teaseTimerRef.current);
      teaseTimerRef.current = null;
    }
    setTeasingSound(null);
  }

  const canStart = minMin >= 1 && maxMin >= minMin && maxMin <= 60;

  return (
    <Card>
      <CardHeader
        title="Sit"
        subtitle="Pick a range. The timer picks a hidden duration inside it — you won't know when it ends."
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <RangeField
          label="Shortest session"
          suffix="min"
          value={minMin}
          min={1}
          max={60}
          onChange={(v) => {
            setMin(v);
            if (maxMin < v) setMax(v);
          }}
        />
        <RangeField
          label="Longest session"
          suffix="min"
          value={maxMin}
          min={minMin}
          max={60}
          onChange={setMax}
        />
      </div>

      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary mb-2">
          Sound
        </div>
        <div className="relative">
          <button
            onClick={() => setSoundOpen((o) => !o)}
            onBlur={() => setTimeout(() => setSoundOpen(false), 150)}
            className="btn btn-soft !py-2.5 !px-4 w-full !justify-between"
          >
            <span className="display text-primary text-[15px] font-medium tracking-tight">
              {SOUND_META[sound].label}
            </span>
            <ChevronDown
              size={14}
              className={`transition-transform ${soundOpen ? "rotate-180" : ""}`}
            />
          </button>
          {soundOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 card !p-1.5 fade-in z-10 max-h-80 overflow-y-auto scrollbar-thin"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              {(Object.keys(SOUND_META) as MeditationSound[]).map((s) => {
                const m = SOUND_META[s];
                const active = s === sound;
                const locked = tier === "free" && !FREE_SOUNDS.includes(s);
                return (
                  <button
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (locked) {
                        // Seduce, don't wall: play a 3-second taste first.
                        void teaseLockedSound(s);
                        return;
                      }
                      previewSound(s);
                      setSoundOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:opacity-90 flex items-start justify-between gap-3"
                    style={{
                      background: active ? "var(--accent-soft)" : "transparent",
                      opacity: locked ? 0.85 : 1,
                    }}
                  >
                    <div className="min-w-0">
                      <div
                        className={`text-[13px] font-medium flex items-center gap-1.5 ${
                          active ? "text-accent" : "text-primary"
                        }`}
                      >
                        {m.label}
                        {locked && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-semibold"
                            style={{
                              background: "var(--accent-soft)",
                              color: "var(--accent-hover)",
                            }}
                          >
                            Pro
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-tertiary">{m.desc}</div>
                    </div>
                    {active && <Check size={13} className="text-accent mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <p className="text-[11px] text-tertiary mt-2">
          {SOUND_META[sound].desc}
        </p>
        {tier === "free" && (
          <p className="text-[10.5px] text-tertiary mt-1.5 italic">
            Tap a Pro sound to hear a 3-second taste.
          </p>
        )}
        {teasingSound && (
          <div
            className="mt-3 rounded-xl border p-3 flex items-center gap-3 fade-in"
            style={{
              background: "var(--accent-soft)",
              borderColor: "var(--accent)",
            }}
          >
            <div
              className="w-8 h-8 rounded-full grid place-items-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              }}
            >
              <Volume2 size={14} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[12px] font-semibold"
                style={{ color: "var(--accent-hover)" }}
              >
                Previewing {SOUND_META[teasingSound].label}…
              </div>
              <div className="text-[11px] text-secondary">
                The full library is yours on Pro — 7 days free.
              </div>
            </div>
            <Button
              onClick={() => {
                stopPreview();
                setSoundOpen(false);
                onUpgrade?.();
              }}
              className="!py-1.5 !px-3 !text-[12px] shrink-0"
              icon={<Sparkles size={12} />}
            >
              Unlock
            </Button>
          </div>
        )}
      </div>

      <VolumeSlider volume={volume} setVolume={setVolume} />

      <div className="flex items-center justify-between mt-6">
        <p className="text-[12px] text-secondary max-w-sm">
          Your session will land somewhere between{" "}
          <span className="text-primary font-semibold">{minMin}</span> and{" "}
          <span className="text-primary font-semibold">{maxMin}</span> minutes.
          You won&apos;t see a clock while you sit.
        </p>
        <Button
          onClick={() => {
            stopPreview();
            onStart();
          }}
          disabled={!canStart}
          icon={<Play size={14} />}
        >
          Begin
        </Button>
      </div>
    </Card>
  );
}

function RangeField({
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-tertiary mb-2">
        {label}
      </div>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{ borderColor: "var(--border-soft)", background: "var(--bg-subtle)" }}
      >
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 rounded-md grid place-items-center text-tertiary hover:text-primary"
        >
          −
        </button>
        <div className="flex-1 text-center">
          <span className="numeric text-3xl text-primary leading-none">{value}</span>
          <span className="text-[11px] text-tertiary ml-1">{suffix}</span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 rounded-md grid place-items-center text-tertiary hover:text-primary"
        >
          +
        </button>
      </div>
    </div>
  );
}

function VolumeSlider({
  volume,
  setVolume,
}: {
  volume: number;
  setVolume: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
        className="text-tertiary hover:text-primary"
      >
        {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="flex-1 accent-amber-600"
        style={{ accentColor: "var(--accent)" }}
      />
      <span className="text-[11px] text-tertiary w-8 text-right numeric">
        {Math.round(volume * 100)}
      </span>
    </div>
  );
}

/* ================= Running ================= */

function RunningCard({
  sound,
  tick,
  onStop,
  volume,
  setVolume,
}: {
  sound: MeditationSound;
  tick: number;
  onStop: () => void;
  volume: number;
  setVolume: (v: number) => void;
}) {
  // Breathing scale oscillates over ~12s (4 in, 4 hold, 4 out)
  const phase = tick % 15;
  const scale =
    phase < 5 ? 1 + (phase / 5) * 0.2 : phase < 10 ? 1.2 : 1.2 - ((phase - 10) / 5) * 0.2;

  return (
    <Card>
      <div className="grid place-items-center py-12 px-4">
        <div
          className="relative grid place-items-center"
          style={{ width: 260, height: 260 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--accent-glow), transparent 70%)",
              transform: `scale(${scale})`,
              transition: "transform 3.5s cubic-bezier(0.45,0.05,0.55,0.95)",
              opacity: 0.6,
            }}
          />
          <div
            className="rounded-full grid place-items-center"
            style={{
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle at 30% 30%, var(--accent-hover), var(--accent) 75%)",
              transform: `scale(${scale})`,
              transition: "transform 3.5s cubic-bezier(0.45,0.05,0.55,0.95)",
              boxShadow: "0 20px 60px -10px var(--accent-glow)",
            }}
          >
            <span
              className="text-white text-[12px] uppercase tracking-[0.3em]"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
            >
              breathe
            </span>
          </div>
        </div>

        <div className="text-center mt-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-tertiary">
            {SOUND_META[sound].label} · timer hidden
          </div>
          <p className="text-[13px] text-secondary mt-2 max-w-xs">
            Close your eyes. Notice your breath. The chime will find you.
          </p>
        </div>

        <div className="mt-8 w-full max-w-sm">
          <VolumeSlider volume={volume} setVolume={setVolume} />
        </div>

        <button
          onClick={onStop}
          className="btn btn-ghost mt-8"
          title="End early without logging"
        >
          <Square size={13} /> End early
        </button>
      </div>
    </Card>
  );
}

/* ================= Guess ================= */

function GuessCard({
  session,
  guessMin,
  setGuessMin,
  onSubmit,
}: {
  session: MeditationSession;
  guessMin: number | "";
  setGuessMin: (v: number | "") => void;
  onSubmit: () => void;
}) {
  return (
    <Card>
      <CardHeader
        title="How long did you sit?"
        subtitle={`Somewhere between ${Math.round(session.minSec / 60)} and ${Math.round(
          session.maxSec / 60
        )} minutes. Take your best guess before we tell you.`}
      />

      <div className="flex items-center gap-4 flex-wrap mb-5">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            borderColor: "var(--border-default)",
            background: "var(--bg-subtle)",
            minWidth: 180,
          }}
        >
          <input
            type="number"
            step="0.5"
            min={0}
            autoFocus
            value={guessMin}
            onChange={(e) => {
              const v = e.target.value;
              setGuessMin(v === "" ? "" : parseFloat(v));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
            className="numeric text-3xl text-primary bg-transparent border-0 outline-none w-20 text-center leading-none"
            placeholder="—"
          />
          <span className="text-[11px] uppercase tracking-widest text-tertiary">
            minutes
          </span>
        </div>
        <Button
          onClick={onSubmit}
          disabled={guessMin === "" || Number(guessMin) < 0}
          icon={<Check size={14} />}
        >
          Reveal
        </Button>
      </div>

      <p className="text-[11px] text-tertiary">
        Half-minutes are fine — e.g. 7.5
      </p>
    </Card>
  );
}

/* ================= Reveal ================= */

function RevealCard({
  session,
  onDone,
}: {
  session: MeditationSession;
  onDone: () => void;
}) {
  const actual = session.actualSec;
  const guess = session.guessSec ?? 0;
  const delta = guess - actual;
  const absDelta = Math.abs(delta);
  const absMin = absDelta / 60;
  const accuracy = actual > 0 ? 1 - Math.min(1, absDelta / actual) : 0;

  const verdict =
    absDelta <= 30
      ? "Remarkable sense of time."
      : absDelta <= 90
      ? "Close — time moved near-truth for you."
      : delta < 0
      ? "Time felt shorter than it was."
      : "Time felt longer than it was.";

  return (
    <Card>
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className="w-14 h-14 rounded-xl shrink-0 grid place-items-center"
          style={{
            background:
              "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
            boxShadow: "0 8px 24px -6px var(--accent-glow)",
          }}
        >
          <Brain size={22} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-tertiary">
            Session complete
          </div>
          <h3 className="display text-primary text-2xl tracking-tight mt-0.5">
            {verdict}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <Stat label="Actual" value={formatSec(actual)} accent />
        <Stat label="Your guess" value={formatSec(guess)} />
        <Stat
          label="Off by"
          value={absMin < 1 ? `${absDelta}s` : `${absMin.toFixed(1)}m`}
          tone={delta > 0 ? "warn" : "good"}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-tertiary mb-1.5">
          <span>Accuracy</span>
          <span className="text-primary numeric">
            {Math.round(accuracy * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(accuracy * 100)}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
            }}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onDone}>Done</Button>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "good" | "warn";
}) {
  const color = accent
    ? "var(--accent-hover)"
    : tone === "good"
    ? "#16a34a"
    : tone === "warn"
    ? "#dc2626"
    : "var(--text-primary)";
  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: "var(--bg-subtle)", borderColor: "var(--border-soft)" }}
    >
      <div className="text-[10px] uppercase tracking-widest text-tertiary">{label}</div>
      <div className="numeric text-2xl mt-1.5 leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

/* ================= Graph ================= */

function ProgressGraph({ sessions }: { sessions: MeditationSession[] }) {
  if (!sessions.length) {
    return (
      <EmptyState
        icon={<Brain size={20} />}
        title="Your time-sense is a skill"
        body="Sit once, guess the length, and this space fills with your actual-vs-guessed progression over time."
      />
    );
  }

  const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  const data = sorted.map((s, i) => ({
    idx: i + 1,
    label: formatDate(s.date, "short"),
    actual: +(s.actualSec / 60).toFixed(2),
    guess: +((s.guessSec ?? 0) / 60).toFixed(2),
    delta: +(((s.guessSec ?? 0) - s.actualSec) / 60).toFixed(2),
  }));

  const avgDelta =
    data.reduce((s, d) => s + d.delta, 0) / Math.max(1, data.length);
  const avgAbsErr =
    data.reduce((s, d) => s + Math.abs(d.delta), 0) / Math.max(1, data.length);

  const totalMinutes = data.reduce((s, d) => s + d.actual, 0);

  return (
    <Card>
      <CardHeader
        title="Actual vs. guess"
        subtitle={`Your perceived time compared to real time across ${data.length} session${data.length === 1 ? "" : "s"}.`}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MiniStat label="Sessions" value={`${data.length}`} />
        <MiniStat label="Total time" value={`${totalMinutes.toFixed(1)}m`} />
        <MiniStat
          label="Avg skew"
          value={`${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(1)}m`}
          help={avgDelta > 0 ? "overestimates time" : "underestimates time"}
        />
        <MiniStat
          label="Avg error"
          value={`${avgAbsErr.toFixed(1)}m`}
          help="distance from actual"
        />
      </div>

      <div className="flex items-center gap-4 text-[11px] text-tertiary mb-3">
        <LegendSwatch color="var(--accent)" label="actual" />
        <LegendSwatch color="var(--text-secondary)" label="guess" dashed />
        <span className="ml-auto text-[10px] uppercase tracking-widest">minutes</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
            <defs>
              <linearGradient id="actual-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 4" />
            <XAxis
              dataKey="idx"
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border-soft)" }}
              tickLine={false}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              content={(props) => <SoftTooltip {...props} unit=" min" />}
              cursor={{ stroke: "var(--accent)", strokeOpacity: 0.3, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              name="actual"
              stroke="var(--accent)"
              strokeWidth={2.5}
              fill="url(#actual-grad)"
              dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "var(--accent)", stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="guess"
              name="your guess"
              stroke="var(--text-secondary)"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "var(--text-secondary)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "var(--text-secondary)", stroke: "#fff", strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div
      className="p-3 rounded-xl border"
      style={{ background: "var(--bg-subtle)", borderColor: "var(--border-soft)" }}
    >
      <div className="text-[10px] uppercase tracking-widest text-tertiary">{label}</div>
      <div className="numeric text-xl text-primary leading-none mt-1.5">{value}</div>
      {help && <div className="text-[10px] text-tertiary mt-1">{help}</div>}
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block"
        style={{
          width: 18,
          height: 2,
          background: dashed
            ? `repeating-linear-gradient(to right, ${color} 0 4px, transparent 4px 8px)`
            : color,
          borderRadius: 1,
        }}
      />
      {label}
    </span>
  );
}

/* ================= Helpers ================= */

function formatSec(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function makeId(): string {
  return (
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}
