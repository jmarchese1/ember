"use client";

import type { AnyEntry, DayLog, Settings, Streaks, WorkoutEntry, JournalEntry, DietEntry, MeditationSession } from "./types";
import { todayISO, daysBetween, moodScore, dietScore, estimateVolume } from "./utils";
import {
  cloudDeleteAll,
  cloudDeleteEntry,
  cloudFetchAllLogs,
  cloudFetchProfile,
  cloudUpsertEntry,
  cloudUpsertProfile,
  cloudFetchMeditations,
  cloudInsertMeditation,
  cloudUpdateMeditationGuess,
} from "./cloud";

let KEY_PREFIX = "habits:";
let _cloudUserId: string | null = null;

/**
 * Register the signed-in user so writes mirror to Supabase.
 * Namespaces localStorage per-user so switching accounts / logging out
 * never mixes data.
 */
export function setCloudUser(userId: string | null) {
  _cloudUserId = userId;
  KEY_PREFIX = userId ? `habits:${userId}:` : "habits:";
}

const K_INDEX = () => `${KEY_PREFIX}index`;
const K_SETTINGS = () => `${KEY_PREFIX}settings`;
const K_STREAKS = () => `${KEY_PREFIX}streaks`;
const K_QUOTE_SEEN = () => `${KEY_PREFIX}quotes:seen`;
const K_LOG = (date: string) => `${KEY_PREFIX}log:${date}`;
const K_MEDITATIONS = () => `${KEY_PREFIX}meditations`;

interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function store(): StorageLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { storage?: StorageLike };
  if (w.storage && typeof w.storage.getItem === "function") return w.storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(k: string, fallback: T): T {
  const s = store();
  if (!s) return fallback;
  try {
    const raw = s.getItem(k);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(k: string, v: T) {
  const s = store();
  if (!s) return;
  try {
    s.setItem(k, JSON.stringify(v));
  } catch {}
}

export function getSettings(): Settings {
  return read<Settings>(K_SETTINGS(), { theme: "light", onboarded: false });
}

export function setSettings(patch: Partial<Settings>) {
  const next = { ...getSettings(), ...patch };
  write(K_SETTINGS(), next);
  if (_cloudUserId) cloudUpsertProfile(_cloudUserId, next).catch(() => {});
  return next;
}

export function getIndex(): string[] {
  return read<string[]>(K_INDEX(), []);
}

function addToIndex(date: string) {
  const idx = getIndex();
  if (!idx.includes(date)) {
    idx.push(date);
    idx.sort();
    write(K_INDEX(), idx);
  }
}

export function getDayLog(date: string): DayLog {
  return read<DayLog>(K_LOG(date), { date });
}

export function getAllLogs(): DayLog[] {
  return getIndex()
    .map((d) => getDayLog(d))
    .filter((l) => l.workout || l.journal || l.diet);
}

export function getAllEntries(kind?: "workout" | "journal" | "diet"): AnyEntry[] {
  const logs = getAllLogs();
  const out: AnyEntry[] = [];
  for (const l of logs) {
    if ((!kind || kind === "workout") && l.workout) out.push(l.workout);
    if ((!kind || kind === "journal") && l.journal) out.push(l.journal);
    if ((!kind || kind === "diet") && l.diet) out.push(l.diet);
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function saveEntry(entry: AnyEntry) {
  const log = getDayLog(entry.date);
  if (entry.kind === "workout") {
    const e = entry as WorkoutEntry;
    e.volume = e.volume ?? estimateVolume(e.movements);
    log.workout = e;
  } else if (entry.kind === "journal") {
    const e = entry as JournalEntry;
    e.moodScore = e.moodScore || moodScore(e.mood);
    log.journal = e;
  } else if (entry.kind === "diet") {
    const e = entry as DietEntry;
    if (!e.qualityScore) e.qualityScore = dietScore(e.quality || "decent");
    log.diet = e;
  }
  write(K_LOG(entry.date), log);
  addToIndex(entry.date);
  updateStreaks();
  if (_cloudUserId) cloudUpsertEntry(_cloudUserId, entry).catch(() => {});
}

export function deleteEntry(date: string, kind: "workout" | "journal" | "diet") {
  const log = getDayLog(date);
  if (kind === "workout") delete log.workout;
  if (kind === "journal") delete log.journal;
  if (kind === "diet") delete log.diet;
  write(K_LOG(date), log);
  updateStreaks();
  if (_cloudUserId) cloudDeleteEntry(_cloudUserId, date, kind).catch(() => {});
}

/**
 * Pull all cloud data into local cache for the signed-in user.
 * Called once on login so the existing sync read APIs work without refactor.
 */
export async function hydrateFromCloud(userId: string): Promise<void> {
  setCloudUser(userId);
  const [logs, profile, meds] = await Promise.all([
    cloudFetchAllLogs(userId),
    cloudFetchProfile(userId),
    cloudFetchMeditations(userId),
  ]);
  if (profile) write(K_SETTINGS(), { ...getSettings(), ...profile });
  const dates: string[] = [];
  for (const l of logs) {
    write(K_LOG(l.date), l);
    dates.push(l.date);
  }
  dates.sort();
  write(K_INDEX(), dates);
  write(K_MEDITATIONS(), meds);
  updateStreaks();
}

/**
 * Wipe all local state for the current user namespace. Used on sign-out.
 */
export function clearLocalForUser() {
  const s = store();
  if (!s) return;
  const idx = getIndex();
  for (const d of idx) s.removeItem(K_LOG(d));
  s.removeItem(K_INDEX());
  s.removeItem(K_SETTINGS());
  s.removeItem(K_STREAKS());
  s.removeItem(K_QUOTE_SEEN());
  s.removeItem(K_MEDITATIONS());
}

/**
 * Delete all user data in both cloud and local storage.
 */
export async function wipeAllData(): Promise<void> {
  if (_cloudUserId) await cloudDeleteAll(_cloudUserId);
  clearLocalForUser();
}

/* ===== Meditation ===== */

export function getAllMeditations(): MeditationSession[] {
  return read<MeditationSession[]>(K_MEDITATIONS(), []);
}

export function saveMeditation(m: MeditationSession) {
  const arr = getAllMeditations();
  arr.push(m);
  write(K_MEDITATIONS(), arr);
  if (_cloudUserId) cloudInsertMeditation(_cloudUserId, m).catch(() => {});
}

export function updateMeditationGuess(id: string, guessSec: number) {
  const arr = getAllMeditations();
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return;
  arr[idx] = { ...arr[idx], guessSec };
  write(K_MEDITATIONS(), arr);
  if (_cloudUserId) cloudUpdateMeditationGuess(_cloudUserId, id, guessSec).catch(() => {});
}

function emptyStreaks(): Streaks {
  return {
    workout: { current: 0, best: 0 },
    journal: { current: 0, best: 0 },
    diet: { current: 0, best: 0 },
  };
}

export function getStreaks(): Streaks {
  return read<Streaks>(K_STREAKS(), emptyStreaks());
}

function computeStreak(dates: string[]): { current: number; best: number; lastDate?: string } {
  if (!dates.length) return { current: 0, best: 0 };
  const sorted = [...dates].sort();
  const today = todayISO();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i]);
    if (gap === 1) run += 1;
    else run = 1;
    if (run > best) best = run;
  }
  const last = sorted[sorted.length - 1];
  const lastGap = daysBetween(last, today);
  let current = 0;
  if (lastGap === 0 || lastGap === 1) {
    current = 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (daysBetween(sorted[i - 1], sorted[i]) === 1) current += 1;
      else break;
    }
  }
  return { current, best, lastDate: last };
}

export function updateStreaks(): Streaks {
  const logs = getAllLogs();
  const w: string[] = [];
  const j: string[] = [];
  const d: string[] = [];
  for (const l of logs) {
    if (l.workout) w.push(l.date);
    if (l.journal) j.push(l.date);
    if (l.diet) d.push(l.date);
  }
  const next: Streaks = {
    workout: computeStreak(w),
    journal: computeStreak(j),
    diet: computeStreak(d),
  };
  const prev = getStreaks();
  next.workout.best = Math.max(next.workout.best, prev.workout.best);
  next.journal.best = Math.max(next.journal.best, prev.journal.best);
  next.diet.best = Math.max(next.diet.best, prev.diet.best);
  write(K_STREAKS(), next);
  return next;
}

export function getQuoteSeen(): string[] {
  return read<string[]>(K_QUOTE_SEEN(), []);
}

export function markQuoteSeen(id: string) {
  const seen = getQuoteSeen();
  if (!seen.includes(id)) {
    seen.push(id);
    if (seen.length > 200) seen.shift();
    write(K_QUOTE_SEEN(), seen);
  }
}

export function exportAll(): string {
  const out = {
    settings: getSettings(),
    streaks: getStreaks(),
    logs: getAllLogs(),
  };
  return JSON.stringify(out, null, 2);
}
