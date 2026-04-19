/**
 * Canonicalize exercise names so "bench" / "Bench" / "BP" / "bench press"
 * collapse into a single "Bench Press" and PRs + the progression chart don't
 * fragment across synonyms.
 */

// Short aliases → canonical name
const ALIASES: Record<string, string> = {
  bp: "Bench Press",
  bench: "Bench Press",
  "flat bench": "Bench Press",
  "barbell bench": "Bench Press",
  "bench press": "Bench Press",

  "incline bench": "Incline Bench Press",
  "incline press": "Incline Bench Press",

  ohp: "Overhead Press",
  press: "Overhead Press",
  "standing press": "Overhead Press",
  "overhead press": "Overhead Press",
  "military press": "Overhead Press",

  dl: "Deadlift",
  deadlift: "Deadlift",
  "conventional deadlift": "Deadlift",
  rdl: "Romanian Deadlift",
  "romanian deadlift": "Romanian Deadlift",
  "stiff leg deadlift": "Stiff Leg Deadlift",
  sldl: "Stiff Leg Deadlift",

  sq: "Back Squat",
  squat: "Back Squat",
  "back squat": "Back Squat",
  "front squat": "Front Squat",
  "goblet squat": "Goblet Squat",

  "pull up": "Pull-ups",
  "pull ups": "Pull-ups",
  pullup: "Pull-ups",
  pullups: "Pull-ups",
  "pull-up": "Pull-ups",
  "pull-ups": "Pull-ups",
  "chin up": "Chin-ups",
  "chin ups": "Chin-ups",
  chinup: "Chin-ups",
  chinups: "Chin-ups",
  "chin-up": "Chin-ups",
  "chin-ups": "Chin-ups",

  "push up": "Push-ups",
  "push ups": "Push-ups",
  pushup: "Push-ups",
  pushups: "Push-ups",
  "push-up": "Push-ups",
  "push-ups": "Push-ups",

  dip: "Dips",
  dips: "Dips",

  row: "Barbell Row",
  rows: "Barbell Row",
  "bent row": "Barbell Row",
  "bent-over row": "Barbell Row",
  "barbell row": "Barbell Row",
  "db row": "Dumbbell Row",
  "dumbbell row": "Dumbbell Row",
  "cable row": "Cable Row",

  lunge: "Lunges",
  lunges: "Lunges",

  curl: "Curls",
  curls: "Curls",
  "bicep curl": "Curls",
  "bicep curls": "Curls",
  "dumbbell curl": "Curls",
  "db curl": "Curls",

  "tri extension": "Tricep Extension",
  "tricep extension": "Tricep Extension",
  "tricep pushdown": "Tricep Pushdown",
  pushdown: "Tricep Pushdown",
  pushdowns: "Tricep Pushdown",

  "lat pulldown": "Lat Pulldown",
  pulldown: "Lat Pulldown",
  pulldowns: "Lat Pulldown",

  "leg press": "Leg Press",
  "leg curl": "Leg Curl",
  "leg extension": "Leg Extension",

  "calf raise": "Calf Raise",
  "calf raises": "Calf Raise",
  "standing calf raise": "Calf Raise",

  run: "Run",
  running: "Run",
  jog: "Run",
  "treadmill run": "Run",
  "treadmill running": "Run",

  row_erg: "Row (Erg)",
  "rowing machine": "Row (Erg)",
};

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      if (!w) return w;
      // Keep fully-uppercase short tokens (RDL, OHP) — but we map those via aliases already
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function canonicalizeExerciseName(raw: string): string {
  if (!raw) return "";
  const key = raw
    .trim()
    .toLowerCase()
    // strip trailing punctuation
    .replace(/[.,;:]+$/g, "")
    // normalize whitespace
    .replace(/\s+/g, " ")
    // normalize hyphens
    .replace(/—/g, "-");

  if (ALIASES[key]) return ALIASES[key];

  // Try with spaces in place of hyphens and vice versa
  const noHyphen = key.replace(/-/g, " ");
  if (ALIASES[noHyphen]) return ALIASES[noHyphen];
  const withHyphen = key.replace(/\s+/g, "-");
  if (ALIASES[withHyphen]) return ALIASES[withHyphen];

  // Fallback: Title Case the input
  return titleCase(key);
}

export function canonicalizeKey(raw: string): string {
  return canonicalizeExerciseName(raw).toLowerCase();
}
