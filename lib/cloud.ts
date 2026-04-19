"use client";
import { supabase } from "./supabase-client";
import type { AnyEntry, DayLog, MeditationSession, Settings } from "./types";

/**
 * Pull all day logs for the signed-in user.
 */
export async function cloudFetchAllLogs(userId: string): Promise<DayLog[]> {
  const { data, error } = await supabase()
    .from("day_logs")
    .select("date, workout, journal, diet")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) {
    console.error("[cloud] fetch logs failed", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    date: r.date as string,
    workout: (r.workout ?? undefined) as DayLog["workout"],
    journal: (r.journal ?? undefined) as DayLog["journal"],
    diet: (r.diet ?? undefined) as DayLog["diet"],
  }));
}

/**
 * Upsert one entry by merging into the day row.
 */
export async function cloudUpsertEntry(userId: string, entry: AnyEntry): Promise<void> {
  const patch: Record<string, unknown> = {
    user_id: userId,
    date: entry.date,
    [entry.kind]: entry,
  };
  const { error } = await supabase()
    .from("day_logs")
    .upsert(patch, { onConflict: "user_id,date" });
  if (error) console.error("[cloud] upsert failed", error.message);
}

export async function cloudDeleteEntry(
  userId: string,
  date: string,
  kind: "workout" | "journal" | "diet"
): Promise<void> {
  const { error } = await supabase()
    .from("day_logs")
    .update({ [kind]: null })
    .eq("user_id", userId)
    .eq("date", date);
  if (error) console.error("[cloud] clear entry failed", error.message);
}

export async function cloudFetchProfile(userId: string): Promise<Settings | null> {
  const { data, error } = await supabase()
    .from("profiles")
    .select("name, goals, theme, onboarded")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[cloud] fetch profile failed", error.message);
    return null;
  }
  if (!data) return null;
  return {
    name: data.name ?? undefined,
    goals: data.goals ?? undefined,
    theme: (data.theme as "light" | "dark") ?? "light",
    onboarded: !!data.onboarded,
  };
}

export async function cloudUpsertProfile(userId: string, patch: Partial<Settings>): Promise<void> {
  const { error } = await supabase()
    .from("profiles")
    .upsert(
      { id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );
  if (error) console.error("[cloud] upsert profile failed", error.message);
}

export async function cloudDeleteAll(userId: string): Promise<void> {
  await supabase().from("day_logs").delete().eq("user_id", userId);
  await supabase().from("meditations").delete().eq("user_id", userId);
  await supabase()
    .from("profiles")
    .update({ name: null, goals: null, onboarded: false })
    .eq("id", userId);
}

export async function cloudInsertMeditation(
  userId: string,
  m: MeditationSession
): Promise<void> {
  const { error } = await supabase().from("meditations").insert({
    id: m.id,
    user_id: userId,
    date: m.date,
    started_at: new Date(m.startedAt).toISOString(),
    min_sec: m.minSec,
    max_sec: m.maxSec,
    actual_sec: m.actualSec,
    guess_sec: m.guessSec,
    sound: m.sound,
  });
  if (error) console.error("[cloud] insert meditation failed", error.message);
}

export async function cloudUpdateMeditationGuess(
  userId: string,
  id: string,
  guessSec: number
): Promise<void> {
  const { error } = await supabase()
    .from("meditations")
    .update({ guess_sec: guessSec })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) console.error("[cloud] update meditation guess failed", error.message);
}

export async function cloudFetchMeditations(
  userId: string
): Promise<MeditationSession[]> {
  const { data, error } = await supabase()
    .from("meditations")
    .select("id, date, started_at, min_sec, max_sec, actual_sec, guess_sec, sound")
    .eq("user_id", userId)
    .order("started_at", { ascending: true });
  if (error) {
    console.error("[cloud] fetch meditations failed", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    date: r.date as string,
    startedAt: new Date(r.started_at as string).getTime(),
    minSec: r.min_sec as number,
    maxSec: r.max_sec as number,
    actualSec: r.actual_sec as number,
    guessSec: (r.guess_sec as number) ?? undefined,
    sound: (r.sound as MeditationSession["sound"]) ?? undefined,
  }));
}
