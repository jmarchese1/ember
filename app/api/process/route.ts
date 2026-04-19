import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { todayISO, moodScore, estimateVolume, dietScore } from "@/lib/utils";
import { canonicalizeExerciseName } from "@/lib/exercise-names";
import type { Kind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";

const SCHEMAS: Record<Kind, string> = {
  workout: `{
  "date": "YYYY-MM-DD",
  "title": "3-6 word punchy title like 'Heavy Push Day' or 'Morning 5K'",
  "summary": "1-2 sentence clean summary in second person, warm and grounded",
  "discipline": "lift | run | cycle | swim | mobility | sport | hiit | other",
  "durationMin": number or null,
  "intensity": "easy" | "moderate" | "hard" | "brutal",
  "movements": [
    { "name": "Bench Press", "sets": 4, "reps": "6-8", "load": "185 lb", "notes": "felt strong" }
  ],
  "tags": ["push","chest"]
}`,
  journal: `{
  "date": "YYYY-MM-DD",
  "title": "3-6 word reflective title",
  "summary": "1-2 sentence reflection in second person, warm and non-judgmental",
  "mood": "bleak" | "heavy" | "steady" | "bright" | "radiant",
  "energy": 1-10 or null,
  "themes": ["work","family","focus"],
  "wins": ["short bullets of positives"],
  "shadows": ["short bullets of struggles"],
  "gratitude": ["things the person was grateful for"],
  "reflection": "one thoughtful sentence — a gentle observation, not advice"
}`,
  diet: `{
  "date": "YYYY-MM-DD",
  "summary": "one sentence summary of the day's eating in second person, warm and non-judgmental",
  "meals": [
    { "name": "Breakfast" | "Lunch" | "Dinner" | "Snack",
      "items": ["3 eggs","toast","coffee"] }
  ],
  "quality": "poor" | "meh" | "decent" | "clean" | "nourishing",
  "reasoning": "ONE short sentence explaining the grade in second person — reference what actually made it that way (variety, protein, processed foods, missed meals, veggies, etc.). No advice. No preaching.",
  "hydration": "optional short note",
  "tags": ["high-protein","veggie-heavy","skipped-dinner"]
}`,
};

const WORKOUT_EXAMPLES = `
Examples showing how to extract movements. Copy the sets/reps/load EXACTLY as the user says them.

INPUT: "bench 4x8 at 185, pull ups 3x10 bodyweight, ran 2 miles"
MOVEMENTS:
  { "name": "Bench Press", "sets": 4, "reps": "8", "load": "185 lb" }
  { "name": "Pull-ups", "sets": 3, "reps": "10", "load": "bodyweight" }
  { "name": "Run", "sets": 1, "reps": "2 mi" }

INPUT: "squats: worked up to 275 for a triple, then 3x5 at 225"
MOVEMENTS:
  { "name": "Back Squat", "sets": 1, "reps": "3", "load": "275 lb", "notes": "top set" }
  { "name": "Back Squat", "sets": 3, "reps": "5", "load": "225 lb" }

INPUT: "4 sets of 6 deadlifts at 315, RDL 3 sets of 10 at 185, then 100 crunches"
MOVEMENTS:
  { "name": "Deadlift", "sets": 4, "reps": "6", "load": "315 lb" }
  { "name": "Romanian Deadlift", "sets": 3, "reps": "10", "load": "185 lb" }
  { "name": "Crunches", "sets": 1, "reps": "100" }

INPUT: "pull-ups AMRAP (got 12), dips bodyweight 4x8, db curls 3x12 30s"
MOVEMENTS:
  { "name": "Pull-ups", "sets": 1, "reps": "12", "load": "bodyweight", "notes": "AMRAP" }
  { "name": "Dips", "sets": 4, "reps": "8", "load": "bodyweight" }
  { "name": "Curls", "sets": 3, "reps": "12", "load": "30 lb db" }

INPUT: "bench 185x5, 205x3, 225x1 then some accessory stuff"
MOVEMENTS:
  { "name": "Bench Press", "sets": 1, "reps": "5", "load": "185 lb" }
  { "name": "Bench Press", "sets": 1, "reps": "3", "load": "205 lb" }
  { "name": "Bench Press", "sets": 1, "reps": "1", "load": "225 lb" }
`;

function systemFor(kind: Kind, date: string) {
  return `You are a calm, warm, encouraging wellness companion.
Transform the user's free-text about their day into clean structured data.
Keep their voice. Never fabricate specifics.

For workout — EXTRACTION RULES:
  • Use the exact numbers the user said. Never round, never average, never guess.
  • "4x8" means 4 sets of 8 reps. "3x10" means 3 sets of 10.
  • If the user gives a pyramid or straight-weight sets, emit ONE MOVEMENT ENTRY PER SET-SCHEME (same exercise can appear multiple times with different load/reps).
  • Always use canonical exercise names in Title Case: "Bench Press" (not "bench" or "BP"), "Pull-ups" (not "pull ups" or "pullup"), "Back Squat", "Deadlift", "Overhead Press", "Romanian Deadlift", "Dumbbell Row", "Barbell Row", "Run", "Curls", "Tricep Pushdown", "Lat Pulldown".
  • If load is bodyweight / machine / band / unspecified, put that string in "load" — don't invent a number.
  • If sets or reps aren't given, put sets=1 and reps as whatever distance/duration was described ("2 mi", "30 min").
  • "notes" is for qualifiers like "felt gassed", "top set", "AMRAP", "drop set".
${WORKOUT_EXAMPLES}

For journal: detect mood carefully — do not over-interpret. "steady" is the neutral default.
For diet: DO NOT estimate calories, macros, protein, carbs, or fat — never. Grade the day's eating 1–5 instead:
  • poor (1): mostly processed, very low variety, significantly undereating or binging
  • meh (2): skewed unbalanced, few vegetables, heavy processed foods
  • decent (3): solid but unremarkable — mixed quality, adequate
  • clean (4): whole foods dominant, good protein + vegetable intake, minimal processed
  • nourishing (5): excellent variety + whole foods + adequate protein + vegetables + reasonable portions
Be cautious and fair. Default to "decent" when unclear.

Today's date is ${date}. Use it unless the user references another day.

Respond with a SINGLE valid JSON object matching exactly this shape. No prose. No markdown fences.

${SCHEMAS[kind]}`;
}

function stripFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {}
  const i = s.indexOf("{"),
    j = s.lastIndexOf("}");
  if (i !== -1 && j > i) {
    try {
      return JSON.parse(s.slice(i, j + 1)) as Record<string, unknown>;
    } catch {}
  }
  return null;
}

function heuristicFallback(kind: Kind, date: string, raw: string) {
  const now = Date.now();
  const first = raw.split(/[\n.]/)[0]?.trim().slice(0, 60) || "Entry";
  if (kind === "workout") {
    const dur = raw.match(/(\d+)\s*(?:min|minutes?|m)\b/i);
    const intensity = /brutal|crushed|destroyed|max/i.test(raw)
      ? "brutal"
      : /hard|tough|heavy/i.test(raw)
      ? "hard"
      : /easy|light|recovery/i.test(raw)
      ? "easy"
      : "moderate";
    return {
      kind,
      date,
      raw,
      title: first,
      summary: "Session logged without AI parsing.",
      discipline: /run|jog|5k|10k/i.test(raw)
        ? "run"
        : /yoga|mobility|stretch/i.test(raw)
        ? "mobility"
        : "lift",
      durationMin: dur ? Number(dur[1]) : undefined,
      intensity,
      movements: [],
      tags: ["unprocessed"],
      createdAt: now,
    };
  }
  if (kind === "journal") {
    return {
      kind,
      date,
      raw,
      title: first,
      summary: "Reflection logged without AI parsing.",
      mood: "steady",
      moodScore: 3,
      themes: [],
      wins: [],
      shadows: [],
      gratitude: [],
      createdAt: now,
    };
  }
  return {
    kind,
    date,
    raw,
    summary: "Meals logged without AI parsing.",
    meals: [
      {
        name: "Day",
        items: raw
          .split(/[,\n]/)
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 12),
      },
    ],
    quality: "decent",
    qualityScore: 3,
    reasoning: "Logged without AI grading.",
    tags: ["unprocessed"],
    createdAt: now,
  };
}

type AnyObj = Record<string, unknown>;

function normalize(kind: Kind, j: AnyObj | null, fallbackDate: string, raw: string) {
  const b = (j ?? {}) as AnyObj;
  const now = Date.now();
  const date =
    typeof b.date === "string" && /\d{4}-\d{2}-\d{2}/.test(b.date) ? b.date : fallbackDate;

  if (kind === "workout") {
    const movements = Array.isArray(b.movements) ? (b.movements as AnyObj[]) : [];
    const mvClean = movements.map((m) => ({
      name: canonicalizeExerciseName(String(m.name ?? "")),
      sets: typeof m.sets === "number" ? m.sets : undefined,
      reps: typeof m.reps === "string" ? m.reps : m.reps != null ? String(m.reps) : undefined,
      load: typeof m.load === "string" ? m.load : m.load != null ? String(m.load) : undefined,
      notes: typeof m.notes === "string" ? m.notes : undefined,
    }));
    return {
      kind,
      date,
      raw,
      title: String(b.title ?? "Session"),
      summary: String(b.summary ?? ""),
      discipline: String(b.discipline ?? "other"),
      durationMin: typeof b.durationMin === "number" ? b.durationMin : undefined,
      intensity: (["easy", "moderate", "hard", "brutal"].includes(String(b.intensity))
        ? b.intensity
        : "moderate") as "easy" | "moderate" | "hard" | "brutal",
      movements: mvClean,
      volume: estimateVolume(mvClean),
      tags: Array.isArray(b.tags) ? (b.tags as unknown[]).map(String) : [],
      createdAt: now,
    };
  }
  if (kind === "journal") {
    const mood = (["bleak", "heavy", "steady", "bright", "radiant"].includes(String(b.mood))
      ? b.mood
      : "steady") as "bleak" | "heavy" | "steady" | "bright" | "radiant";
    return {
      kind,
      date,
      raw,
      title: String(b.title ?? "Reflection"),
      summary: String(b.summary ?? ""),
      mood,
      moodScore: moodScore(mood),
      energy: typeof b.energy === "number" ? b.energy : undefined,
      themes: Array.isArray(b.themes) ? (b.themes as unknown[]).map(String) : [],
      wins: Array.isArray(b.wins) ? (b.wins as unknown[]).map(String) : [],
      shadows: Array.isArray(b.shadows) ? (b.shadows as unknown[]).map(String) : [],
      gratitude: Array.isArray(b.gratitude) ? (b.gratitude as unknown[]).map(String) : [],
      reflection: typeof b.reflection === "string" ? b.reflection : undefined,
      createdAt: now,
    };
  }
  const meals = Array.isArray(b.meals) ? (b.meals as AnyObj[]) : [];
  const mealsClean = meals.map((m) => ({
    name: String(m.name ?? "Meal"),
    items: Array.isArray(m.items) ? (m.items as unknown[]).map(String) : [],
  }));
  const quality = (
    ["poor", "meh", "decent", "clean", "nourishing"].includes(String(b.quality))
      ? b.quality
      : "decent"
  ) as "poor" | "meh" | "decent" | "clean" | "nourishing";
  return {
    kind,
    date,
    raw,
    summary: String(b.summary ?? ""),
    meals: mealsClean,
    quality,
    qualityScore: dietScore(quality),
    reasoning: typeof b.reasoning === "string" ? b.reasoning : "",
    hydration: typeof b.hydration === "string" ? b.hydration : undefined,
    tags: Array.isArray(b.tags) ? (b.tags as unknown[]).map(String) : [],
    createdAt: now,
  };
}

async function encourage(
  name: string | undefined,
  parts: { workout?: unknown; journal?: unknown; diet?: unknown }
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return "Logged. Keep showing up.";
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 140,
      system: `You are a calm, warm, emotionally intelligent wellness companion.
Write ONE short sentence of genuine encouragement based on what the user logged today.
- Max 20 words.
- Reference something specific from the entries when possible.
- Warm but not saccharine. No exclamation marks. No emojis. No clichés like "crushing it".
- If the journal shows a hard day, acknowledge it gently before encouraging.
- Do not use the user's name unless it feels natural.`,
      messages: [
        {
          role: "user",
          content: `User name: ${name || "friend"}\n\nLogged today:\n${JSON.stringify(parts, null, 2)}`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .trim();
    return text || "Logged. Keep showing up.";
  } catch {
    return "Logged. Keep showing up.";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputs = body.inputs as { kind: Kind; text: string }[];
    const date = (body.date as string) || todayISO();
    const name = body.name as string | undefined;

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json({ error: "no inputs" }, { status: 400 });
    }

    const results: Record<string, unknown> = {};
    const hasKey = !!process.env.ANTHROPIC_API_KEY;

    await Promise.all(
      inputs.map(async ({ kind, text }) => {
        const t = (text || "").trim();
        if (!t) return;
        if (!["workout", "journal", "diet"].includes(kind)) return;

        if (!hasKey) {
          results[kind] = heuristicFallback(kind, date, t);
          return;
        }
        try {
          const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1600,
            system: systemFor(kind, date),
            messages: [{ role: "user", content: t }],
          });
          const out = msg.content
            .filter((b): b is Anthropic.TextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n");
          const parsed = safeParse(stripFences(out));
          results[kind] = normalize(kind, parsed, date, t);
        } catch (err) {
          console.error(`[process ${kind}] LLM failed:`, err instanceof Error ? err.message : err);
          results[kind] = heuristicFallback(kind, date, t);
        }
      })
    );

    const message = await encourage(name, results);

    return NextResponse.json({ entries: results, message, date });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
