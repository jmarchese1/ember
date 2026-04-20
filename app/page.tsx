"use client";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Home, Dumbbell, BookOpen, Salad, LayoutDashboard, Brain } from "lucide-react";
import { TopBar } from "@/components/top-bar";
import { LogTab } from "@/components/log-tab";
import { TrainingTab } from "@/components/training-tab";
import { DietTab } from "@/components/diet-tab";
import { JournalTab } from "@/components/journal-tab";
import { DashboardTab } from "@/components/dashboard-tab";
import { MeditationTab } from "@/components/meditation-tab";
import { Onboarding } from "@/components/onboarding";
import { Breathing } from "@/components/breathing";
import { LoginScreen } from "@/components/login";
import { DataControls } from "@/components/data-controls";
import { StreakCalendar } from "@/components/streak-calendar";
import { InstallHint } from "@/components/install-hint";
import { ToastViewport } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase-client";
import {
  getSettings,
  getStreaks,
  setSettings,
  updateStreaks,
  hydrateFromCloud,
  setCloudUser,
  clearLocalForUser,
} from "@/lib/storage";
import type { Settings, Streaks } from "@/lib/types";
import { classNames } from "@/lib/utils";

type Tab = "log" | "training" | "diet" | "journal" | "meditation" | "dashboard";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "log", label: "Home", icon: <Home size={15} /> },
  { id: "training", label: "Training", icon: <Dumbbell size={15} /> },
  { id: "diet", label: "Diet", icon: <Salad size={15} /> },
  { id: "journal", label: "Journal", icon: <BookOpen size={15} /> },
  { id: "meditation", label: "Meditation", icon: <Brain size={15} /> },
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={15} /> },
];

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>("log");
  const [settings, setSettingsState] = useState<Settings>({ theme: "light", onboarded: false });
  const [streaks, setStreaksState] = useState<Streaks>({
    workout: { current: 0, best: 0 },
    journal: { current: 0, best: 0 },
    diet: { current: 0, best: 0 },
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const client = supabase();

    // Clean the magic-link `?code=` + `error=` params from the URL so refreshes
    // don't try to re-exchange an already-used code, which would drop the session.
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const dirty =
          url.searchParams.has("code") ||
          url.searchParams.has("error") ||
          url.searchParams.has("error_description") ||
          url.hash.includes("access_token");
        if (dirty) {
          url.searchParams.delete("code");
          url.searchParams.delete("error");
          url.searchParams.delete("error_description");
          url.hash = "";
          // Delay slightly so Supabase's detectSessionInUrl has a chance to read it first.
          setTimeout(() => {
            window.history.replaceState({}, "", url.pathname + url.search);
          }, 300);
        }
      }
    } catch {}

    client.auth.getSession().then((r: { data: { session: Session | null } }) => {
      setSession(r.data.session);
      setSessionChecked(true);
    });

    const { data: sub } = client.auth.onAuthStateChange(
      (_evt: string, sess: Session | null) => {
        setSession(sess);
        setSessionChecked(true);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  // Hydrate data + settings when we have a session (or use local when guest)
  useEffect(() => {
    if (!sessionChecked) return;
    setHydrated(false);
    (async () => {
      if (session?.user?.id) {
        await hydrateFromCloud(session.user.id);
      } else {
        setCloudUser(null);
      }
      const s = getSettings();
      setSettingsState(s);
      setStreaksState(updateStreaks());
      setRefreshKey((k) => k + 1);
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", s.theme === "dark");
      }
      setHydrated(true);
    })();
  }, [session, sessionChecked]);

  function toggleTheme() {
    const next = settings.theme === "dark" ? "light" : "dark";
    const updated = setSettings({ theme: next });
    setSettingsState(updated);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  function handleLogged() {
    setStreaksState(updateStreaks());
    setRefreshKey((k) => k + 1);
  }

  // Hold the loader until session is checked AND (if signed in) cloud data is hydrated.
  // This prevents the Onboarding modal from flashing with default `onboarded: false`
  // while we're still fetching the cloud profile.
  if (!mounted || !sessionChecked || (session && !hydrated)) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div
          className="w-8 h-8 rounded-full animate-pulse"
          style={{ background: "var(--accent-soft)" }}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LoginScreen />
        <ToastViewport />
      </>
    );
  }

  const needsOnboarding = !settings.onboarded;

  return (
    <div className="min-h-screen bg-base">
      <TopBar
        settings={settings}
        streaks={streaks}
        onToggleTheme={toggleTheme}
        onOpenBreathing={() => setBreathing(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenStreak={() => setStreakOpen(true)}
        email={session.user.email ?? undefined}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <nav className="py-4 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={classNames("tab", tab === t.id && "active")}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <main className="pb-16">
          {tab === "log" && (
            <LogTab
              settings={settings}
              streaks={streaks}
              onLogged={handleLogged}
              refreshKey={refreshKey}
            />
          )}
          {tab === "training" && <TrainingTab streaks={streaks} refreshKey={refreshKey} />}
          {tab === "diet" && <DietTab streaks={streaks} refreshKey={refreshKey} />}
          {tab === "journal" && <JournalTab streaks={streaks} refreshKey={refreshKey} />}
          {tab === "meditation" && <MeditationTab refreshKey={refreshKey} />}
          {tab === "dashboard" && (
            <DashboardTab settings={settings} streaks={streaks} refreshKey={refreshKey} />
          )}
        </main>

        <footer className="pb-8 pt-4 text-center text-[11px] uppercase tracking-[0.25em] text-tertiary safe-bottom">
          Ember · small fires, long burns
        </footer>
      </div>

      {needsOnboarding && (
        <Onboarding
          onDone={() => {
            setSettingsState(getSettings());
          }}
        />
      )}

      {breathing && <Breathing onClose={() => setBreathing(false)} />}

      {streakOpen && (
        <StreakCalendar
          streaks={streaks}
          refreshKey={refreshKey}
          onClose={() => setStreakOpen(false)}
        />
      )}

      {accountOpen && (
        <DataControls
          email={session.user.email ?? ""}
          onClose={() => setAccountOpen(false)}
          onSignedOut={() => {
            clearLocalForUser();
            setAccountOpen(false);
          }}
          onSettingsChanged={() => {
            setSettingsState(getSettings());
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      <ToastViewport />
      <InstallHint />
    </div>
  );
}
