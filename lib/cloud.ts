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

/* ===== Community: public profiles + friendships ===== */

export interface PublicProfile {
  user_id: string;
  display_name: string | null;
  bio: string | null;
  top_themes: string[];
  discoverable: boolean;
  updated_at: string;
}

export interface Friendship {
  requester: string;
  recipient: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export async function cloudGetMyPublicProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase()
    .from("public_profiles")
    .select("user_id, display_name, bio, top_themes, discoverable, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[cloud] get my public profile failed", error.message);
    return null;
  }
  return (data as PublicProfile) || null;
}

export async function cloudUpsertMyPublicProfile(
  userId: string,
  patch: Partial<PublicProfile>
): Promise<void> {
  const { error } = await supabase()
    .from("public_profiles")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) console.error("[cloud] upsert public profile failed", error.message);
}

export async function cloudFetchDiscoverable(
  excludeUserId: string
): Promise<PublicProfile[]> {
  const { data, error } = await supabase()
    .from("public_profiles")
    .select("user_id, display_name, bio, top_themes, discoverable, updated_at")
    .eq("discoverable", true)
    .neq("user_id", excludeUserId)
    .limit(100);
  if (error) {
    console.error("[cloud] fetch discoverable failed", error.message);
    return [];
  }
  return (data as PublicProfile[]) ?? [];
}

export async function cloudFetchFriendships(userId: string): Promise<Friendship[]> {
  const { data, error } = await supabase()
    .from("friendships")
    .select("requester, recipient, status, created_at")
    .or(`requester.eq.${userId},recipient.eq.${userId}`);
  if (error) {
    console.error("[cloud] fetch friendships failed", error.message);
    return [];
  }
  return (data as Friendship[]) ?? [];
}

export async function cloudRequestFriend(
  userId: string,
  otherId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase()
    .from("friendships")
    .insert({ requester: userId, recipient: otherId, status: "pending" });
  if (error) {
    console.error("[cloud] request friend failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function cloudRespondToFriend(
  myUserId: string,
  requesterId: string,
  accept: boolean
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase()
    .from("friendships")
    .update({ status: accept ? "accepted" : "declined" })
    .eq("requester", requesterId)
    .eq("recipient", myUserId);
  if (error) {
    console.error("[cloud] respond friend failed", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function cloudRemoveFriendship(
  userId: string,
  otherId: string
): Promise<void> {
  // Delete both directions in case row exists either way
  await supabase()
    .from("friendships")
    .delete()
    .or(
      `and(requester.eq.${userId},recipient.eq.${otherId}),and(requester.eq.${otherId},recipient.eq.${userId})`
    );
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
