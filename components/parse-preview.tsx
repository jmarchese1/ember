"use client";
import { useState } from "react";
import {
  X,
  Dumbbell,
  BookOpen,
  Salad,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import type {
  AnyEntry,
  DietEntry,
  DietQuality,
  Intensity,
  JournalEntry,
  Mood,
  Movement,
  WorkoutEntry,
} from "@/lib/types";
import { dietScore, estimateVolume, moodScore } from "@/lib/utils";
import { canonicalizeExerciseName } from "@/lib/exercise-names";
import { Button } from "./ui/button";

interface Parsed {
  workout?: WorkoutEntry;
  journal?: JournalEntry;
  diet?: DietEntry;
}

const INTENSITIES: Intensity[] = ["easy", "moderate", "hard", "brutal"];
const MOODS: Mood[] = ["bleak", "heavy", "steady", "bright", "radiant"];
const QUALITIES: DietQuality[] = ["poor", "meh", "decent", "clean", "nourishing"];

const MOOD_COLORS: Record<Mood, string> = {
  bleak: "#57534e",
  heavy: "#a8a29e",
  steady: "#fcd34d",
  bright: "#f97316",
  radiant: "#dc2626",
};
const QUALITY_COLORS: Record<DietQuality, string> = {
  poor: "#78716c",
  meh: "#a8a29e",
  decent: "#fcd34d",
  clean: "#f97316",
  nourishing: "#dc2626",
};

export function ParsePreview({
  parsed,
  onCancel,
  onSave,
}: {
  parsed: Parsed;
  onCancel: () => void;
  onSave: (final: Parsed) => void;
}) {
  const [workout, setWorkout] = useState<WorkoutEntry | undefined>(parsed.workout);
  const [journal, setJournal] = useState<JournalEntry | undefined>(parsed.journal);
  const [diet, setDiet] = useState<DietEntry | undefined>(parsed.diet);

  const hasAny = workout || journal || diet;

  function save() {
    const final: Parsed = {};
    if (workout) {
      const cleaned = {
        ...workout,
        movements: workout.movements
          .map((m) => ({ ...m, name: canonicalizeExerciseName(m.name) }))
          .filter((m) => m.name.trim() || m.load || m.reps || m.sets),
      };
      cleaned.volume = estimateVolume(cleaned.movements);
      final.workout = cleaned;
    }
    if (journal) {
      final.journal = { ...journal, moodScore: moodScore(journal.mood) };
    }
    if (diet) {
      final.diet = { ...diet, qualityScore: dietScore(diet.quality) };
    }
    onSave(final);
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4 fade-in"
      style={{ background: "rgba(12, 10, 9, 0.62)", backdropFilter: "blur(8px)" }}
      onClick={onCancel}
    >
      <div
        className="card max-w-2xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin p-6 md:p-7 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent">
              <Sparkles size={12} />
              AI parsed · review before saving
            </div>
            <h2 className="display text-primary text-2xl tracking-tight mt-1">
              Does this look right?
            </h2>
            <p className="text-[13px] text-secondary mt-1">
              Tap any field to fix it. You know your reps better than we do.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="btn btn-ghost !px-2.5 !py-2"
            aria-label="discard"
          >
            <X size={16} />
          </button>
        </div>

        {!hasAny && (
          <div className="text-sm text-tertiary py-8 text-center">
            Nothing to save. Close and try again.
          </div>
        )}

        {/* Workout */}
        {workout && (
          <Section icon={<Dumbbell size={14} />} title="Training">
            <TextField
              label="Title"
              value={workout.title}
              onChange={(v) => setWorkout({ ...workout, title: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label help="AI inferred this from words like 'gassed', 'easy', 'brutal', 'light'. Nudge it if it missed.">
                  Intensity
                </Label>
                <PillGroup
                  options={INTENSITIES}
                  value={workout.intensity}
                  onChange={(v) => setWorkout({ ...workout, intensity: v as Intensity })}
                />
              </div>
              <NumField
                label="Duration (min)"
                value={workout.durationMin}
                onChange={(v) => setWorkout({ ...workout, durationMin: v })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label help="Rows the AI pulled from your text. Missing lift? Add a row. Wrong weight? Edit it.">
                  Movements
                </Label>
                <button
                  className="text-[11px] flex items-center gap-1 text-accent hover:underline"
                  onClick={() =>
                    setWorkout({
                      ...workout,
                      movements: [
                        ...workout.movements,
                        { name: "", sets: undefined, reps: "", load: "" },
                      ],
                    })
                  }
                >
                  <Plus size={11} /> add row
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-[1.6fr_60px_70px_1fr_28px] gap-2 text-[10px] uppercase tracking-widest text-tertiary px-1">
                  <span>Exercise</span>
                  <span>Sets</span>
                  <span>Reps</span>
                  <span>Load</span>
                  <span />
                </div>
                {workout.movements.length === 0 ? (
                  <div
                    className="text-[12px] text-tertiary py-3 px-3 rounded-lg text-center italic"
                    style={{ background: "var(--bg-subtle)" }}
                  >
                    No movements parsed. Add one to log a session.
                  </div>
                ) : (
                  workout.movements.map((m, i) => (
                    <MovementRow
                      key={i}
                      m={m}
                      onChange={(next) => {
                        const arr = [...workout.movements];
                        arr[i] = next;
                        setWorkout({ ...workout, movements: arr });
                      }}
                      onRemove={() => {
                        const arr = workout.movements.filter((_, j) => j !== i);
                        setWorkout({ ...workout, movements: arr });
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Journal */}
        {journal && (
          <Section icon={<BookOpen size={14} />} title="Journal">
            <TextField
              label="Title"
              value={journal.title}
              onChange={(v) => setJournal({ ...journal, title: v })}
            />
            <div>
              <Label help="AI picked this from emotional words in your entry (e.g. 'heavy', 'peaceful', 'on fire'). Trust your gut — change it if it feels off.">
                Mood
              </Label>
              <PillGroup
                options={MOODS}
                value={journal.mood}
                onChange={(v) => setJournal({ ...journal, mood: v as Mood })}
                colors={MOOD_COLORS as Record<string, string>}
              />
            </div>
            {typeof journal.energy === "number" && (
              <NumField
                label="Energy (1-10)"
                value={journal.energy}
                onChange={(v) =>
                  setJournal({ ...journal, energy: v })
                }
              />
            )}
            <TextField
              label="Summary"
              value={journal.summary}
              onChange={(v) => setJournal({ ...journal, summary: v })}
              multiline
            />
          </Section>
        )}

        {/* Diet */}
        {diet && (
          <Section icon={<Salad size={14} />} title="Diet">
            <div>
              <Label help="AI judged this from food mix + portions (e.g. whole foods, balance, skipped meals). Your body knows better — override if so.">
                Quality
              </Label>
              <PillGroup
                options={QUALITIES}
                value={diet.quality}
                onChange={(v) => setDiet({ ...diet, quality: v as DietQuality })}
                colors={QUALITY_COLORS as Record<string, string>}
              />
            </div>
            <TextField
              label="Summary"
              value={diet.summary}
              onChange={(v) => setDiet({ ...diet, summary: v })}
              multiline
            />
            <TextField
              label="Reasoning"
              value={diet.reasoning}
              onChange={(v) => setDiet({ ...diet, reasoning: v })}
              multiline
            />
          </Section>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
          <Button variant="ghost" onClick={onCancel}>
            Discard
          </Button>
          <Button onClick={save} disabled={!hasAny} icon={<Check size={14} />}>
            Save log
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-4 p-4 rounded-xl border space-y-3"
      style={{ background: "var(--bg-subtle)", borderColor: "var(--border-soft)" }}
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent-hover">
        <span className="text-accent">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Label({
  children,
  help,
}: {
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[10px] uppercase tracking-widest text-tertiary">
        {children}
      </span>
      {help && (
        <span
          className="relative group inline-flex"
          tabIndex={0}
          aria-label={help}
        >
          <Info
            size={11}
            className="text-tertiary hover:text-accent cursor-help"
          />
          <span
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 px-2.5 py-1.5 rounded-md text-[11px] leading-snug text-left normal-case tracking-normal opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-20"
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {help}
          </span>
        </span>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          className="textarea !min-h-[60px] !py-2"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input !py-1.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        className="input !py-1.5"
        value={value ?? ""}
        onChange={(e) => {
          const n = e.target.value === "" ? undefined : Number(e.target.value);
          onChange(Number.isNaN(n) ? undefined : n);
        }}
      />
    </label>
  );
}

function PillGroup({
  options,
  value,
  onChange,
  colors,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  colors?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        const color = colors?.[o];
        return (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium capitalize border transition-all"
            style={{
              background: active
                ? color
                  ? color
                  : "var(--accent)"
                : "var(--bg-card)",
              color: active ? "#fff" : "var(--text-secondary)",
              borderColor: active ? "transparent" : "var(--border-soft)",
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function MovementRow({
  m,
  onChange,
  onRemove,
}: {
  m: Movement;
  onChange: (m: Movement) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[1.6fr_60px_70px_1fr_28px] gap-2 items-center">
      <input
        className="input !py-1.5 !text-[13px]"
        placeholder="Bench Press"
        value={m.name}
        onChange={(e) => onChange({ ...m, name: e.target.value })}
        onBlur={(e) =>
          onChange({ ...m, name: canonicalizeExerciseName(e.target.value) })
        }
      />
      <input
        type="number"
        className="input !py-1.5 !text-[13px] !px-2 text-center"
        placeholder="3"
        value={m.sets ?? ""}
        onChange={(e) =>
          onChange({
            ...m,
            sets: e.target.value === "" ? undefined : Number(e.target.value),
          })
        }
      />
      <input
        className="input !py-1.5 !text-[13px] !px-2 text-center"
        placeholder="8"
        value={m.reps ?? ""}
        onChange={(e) => onChange({ ...m, reps: e.target.value })}
      />
      <input
        className="input !py-1.5 !text-[13px]"
        placeholder="185 lb"
        value={m.load ?? ""}
        onChange={(e) => onChange({ ...m, load: e.target.value })}
      />
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-md grid place-items-center text-tertiary hover:text-red-600 transition-colors"
        title="Remove"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
