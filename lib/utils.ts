export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(iso: string, opts: "long" | "short" = "long"): string {
  const d = new Date(iso + "T00:00:00");
  if (opts === "short") {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function daysBetween(a: string, b: string): number {
  const aDate = new Date(a + "T00:00:00").getTime();
  const bDate = new Date(b + "T00:00:00").getTime();
  return Math.round((bDate - aDate) / 86400000);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = todayISO();
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

export function moodScore(mood: string): number {
  switch (mood) {
    case "bleak":
      return 1;
    case "heavy":
      return 2;
    case "steady":
      return 3;
    case "bright":
      return 4;
    case "radiant":
      return 5;
    default:
      return 3;
  }
}

export function dietScore(q: string): number {
  switch (q) {
    case "poor":
      return 1;
    case "meh":
      return 2;
    case "decent":
      return 3;
    case "clean":
      return 4;
    case "nourishing":
      return 5;
    default:
      return 3;
  }
}

export function classNames(...s: (string | false | null | undefined)[]): string {
  return s.filter(Boolean).join(" ");
}

export function estimateVolume(
  movements: { sets?: number; reps?: string; load?: string }[]
): number {
  let total = 0;
  for (const m of movements) {
    const sets = m.sets ?? 0;
    const reps = parseInt((m.reps || "").match(/\d+/)?.[0] || "0", 10);
    const load = parseFloat((m.load || "").match(/[\d.]+/)?.[0] || "0");
    if (sets && reps && load) total += sets * reps * load;
  }
  return Math.round(total);
}
