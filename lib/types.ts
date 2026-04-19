export type Kind = "workout" | "journal" | "diet";

export type Intensity = "easy" | "moderate" | "hard" | "brutal";
export type Mood = "bleak" | "heavy" | "steady" | "bright" | "radiant";
export type DietQuality = "poor" | "meh" | "decent" | "clean" | "nourishing";

export interface Movement {
  name: string;
  sets?: number;
  reps?: string;
  load?: string;
  notes?: string;
}

export interface WorkoutEntry {
  kind: "workout";
  date: string;
  raw: string;
  title: string;
  summary: string;
  discipline: string;
  durationMin?: number;
  intensity: Intensity;
  movements: Movement[];
  volume?: number;
  tags: string[];
  createdAt: number;
}

export interface Meal {
  name: string;
  items: string[];
}

export interface DietEntry {
  kind: "diet";
  date: string;
  raw: string;
  summary: string;
  meals: Meal[];
  quality: DietQuality;
  qualityScore: number; // 1..5
  reasoning: string;
  hydration?: string;
  tags: string[];
  createdAt: number;
}

export interface JournalEntry {
  kind: "journal";
  date: string;
  raw: string;
  title: string;
  summary: string;
  mood: Mood;
  moodScore: number;
  energy?: number;
  themes: string[];
  wins: string[];
  shadows: string[];
  gratitude: string[];
  reflection?: string;
  createdAt: number;
}

export type AnyEntry = WorkoutEntry | JournalEntry | DietEntry;

export interface DayLog {
  date: string;
  workout?: WorkoutEntry;
  journal?: JournalEntry;
  diet?: DietEntry;
}

export interface Settings {
  name?: string;
  goals?: string;
  theme: "light" | "dark";
  onboarded: boolean;
}

export interface Streaks {
  workout: { current: number; best: number; lastDate?: string };
  journal: { current: number; best: number; lastDate?: string };
  diet: { current: number; best: number; lastDate?: string };
}

export type MeditationSound =
  | "silent"
  | "white"
  | "pink"
  | "brown"
  | "rain"
  | "ocean"
  | "hum";

export interface MeditationSession {
  id: string;
  date: string;           // YYYY-MM-DD of session
  startedAt: number;      // epoch ms
  minSec: number;         // user-chosen min
  maxSec: number;         // user-chosen max
  actualSec: number;      // randomly chosen + rounded, revealed after guess
  guessSec?: number;      // user's guess in seconds
  sound?: MeditationSound;
}
