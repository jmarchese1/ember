"use client";
import { useEffect, useState } from "react";
import {
  X,
  Download,
  Trash2,
  LogOut,
  User,
  Target,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import {
  clearLocalForUser,
  exportAll,
  getSettings,
  setSettings,
  wipeAllData,
} from "@/lib/storage";
import { Button } from "./ui/button";
import { toast } from "./ui/toast";
import type { Settings } from "@/lib/types";

export function DataControls({
  email,
  onClose,
  onSignedOut,
  onSettingsChanged,
}: {
  email: string;
  onClose: () => void;
  onSignedOut: () => void;
  onSettingsChanged: () => void;
}) {
  const [settings, setSettingsState] = useState<Settings>(() => getSettings());
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [status, setStatus] = useState<string>("free");
  const [billingBusy, setBillingBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: userData } = await supabase().auth.getUser();
        if (!userData?.user) return;
        const { data } = await supabase()
          .from("profiles")
          .select("subscription_tier, subscription_status")
          .eq("id", userData.user.id)
          .maybeSingle();
        if (cancelled) return;
        setTier(((data?.subscription_tier as "free" | "pro") || "free") as "free" | "pro");
        setStatus((data?.subscription_status as string) || "free");
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upgrade() {
    setBillingBusy(true);
    try {
      const { data: sess } = await supabase().auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast("Session expired — sign in again.");
        return;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast(json.error || "Couldn't start checkout.");
      }
    } finally {
      setBillingBusy(false);
    }
  }

  async function manageBilling() {
    setBillingBusy(true);
    try {
      const { data: sess } = await supabase().auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else toast(json.error || "Couldn't open billing portal.");
    } finally {
      setBillingBusy(false);
    }
  }

  function update(patch: Partial<Settings>) {
    const next = setSettings(patch);
    setSettingsState(next);
    onSettingsChanged();
  }

  async function doExport() {
    const json = exportAll();
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ember-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export saved.");
    } catch {
      await navigator.clipboard.writeText(json);
      toast("Copied to clipboard.");
    }
  }

  async function doSignOut() {
    setBusy(true);
    try {
      await supabase().auth.signOut();
      clearLocalForUser();
      onSignedOut();
    } finally {
      setBusy(false);
    }
  }

  async function doWipe() {
    setBusy(true);
    try {
      await wipeAllData();
      toast("Everything erased.", "Fresh start");
      onSettingsChanged();
      setConfirmWipe(false);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4"
      style={{ background: "rgba(12, 10, 9, 0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="card max-w-lg w-full p-6 md:p-7 fade-in max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="display text-primary text-2xl tracking-tight">Your account</h2>
              <p className="text-[12px] text-tertiary mt-1">{email}</p>
            </div>
            <TierBadge tier={tier} />
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost !px-2.5 !py-2"
            aria-label="close"
          >
            <X size={16} />
          </button>
        </div>

        <Section title="Profile">
          <Field
            icon={<User size={14} />}
            label="Name"
            value={settings.name || ""}
            placeholder="First name is fine"
            onChange={(v) => update({ name: v })}
          />
          <Field
            icon={<Target size={14} />}
            label="Goals"
            value={settings.goals || ""}
            placeholder="What are you working toward?"
            onChange={(v) => update({ goals: v })}
            multiline
          />
        </Section>

        <Section title="Subscription">
          {tier === "pro" ? (
            <div
              className="p-4 rounded-xl border flex items-start gap-3"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-soft), transparent 120%)",
                borderColor: "var(--accent)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Sparkles size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary">Ember Pro</div>
                <div className="text-[12px] text-secondary mt-0.5 leading-snug">
                  Weekly AI insights, unlimited parses, meditation library. Status:{" "}
                  <span className="capitalize">{status}</span>.
                </div>
              </div>
              <button
                onClick={manageBilling}
                disabled={billingBusy}
                className="btn btn-ghost !py-1.5 !px-3 text-[12px]"
              >
                {billingBusy ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                Manage
              </button>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl border"
              style={{
                background:
                  "linear-gradient(135deg, var(--bg-card), var(--accent-soft) 200%)",
                borderColor: "var(--border-soft)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "#fff",
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-primary">Upgrade to Pro</div>
                  <div className="text-[12px] text-secondary mt-0.5 leading-snug">
                    Unlock deeper weekly AI reflections, unlimited log parsing,
                    and the full meditation sound library.
                  </div>
                </div>
              </div>
              <Button
                onClick={upgrade}
                disabled={billingBusy}
                className="w-full !justify-center"
                icon={
                  billingBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )
                }
              >
                {billingBusy ? "Starting checkout…" : "Upgrade"}
              </Button>
            </div>
          )}
        </Section>

        <Section title="Your data">
          <RowButton
            icon={<Download size={15} />}
            title="Export everything"
            body="Download a JSON file with your settings, streaks, and every log."
            onClick={doExport}
          />
          <RowButton
            icon={<LogOut size={15} />}
            title="Sign out"
            body="You can sign back in anytime — your data stays in the cloud."
            onClick={doSignOut}
            disabled={busy}
          />
        </Section>

        <Section title="Danger zone" accent="danger">
          {!confirmWipe ? (
            <RowButton
              icon={<Trash2 size={15} />}
              title="Delete all data"
              body="Permanently erases your entries and profile. Keeps your account."
              onClick={() => setConfirmWipe(true)}
              danger
            />
          ) : (
            <div
              className="p-4 rounded-xl border"
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                borderColor: "rgba(239, 68, 68, 0.25)",
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle size={18} style={{ color: "#dc2626" }} className="shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                    This cannot be undone.
                  </div>
                  <p className="text-[12px] text-secondary mt-1 leading-relaxed">
                    Every workout, journal entry, meal log, streak, and profile detail will be
                    erased from the cloud and this device.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmWipe(false)}
                  disabled={busy}
                >
                  Keep my data
                </Button>
                <button
                  onClick={doWipe}
                  disabled={busy}
                  className="btn flex-1 !justify-center text-white"
                  style={{
                    background: "#dc2626",
                    borderColor: "#b91c1c",
                  }}
                >
                  {busy ? "Erasing…" : "Yes, erase everything"}
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: "free" | "pro" }) {
  if (tier !== "pro") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold"
        style={{
          background: "var(--bg-subtle)",
          color: "var(--text-tertiary)",
          border: "1px solid var(--border-soft)",
        }}
      >
        Free
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-semibold"
      style={{
        background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
        color: "#fff",
      }}
    >
      <Sparkles size={10} />
      Pro
    </span>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: "danger";
}) {
  return (
    <div className="mb-6 last:mb-0">
      <div
        className="text-[10px] uppercase tracking-[0.2em] mb-3"
        style={{ color: accent === "danger" ? "#dc2626" : "var(--text-tertiary)" }}
      >
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  placeholder,
  onChange,
  multiline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const [local, setLocal] = useState(value);
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-tertiary mb-2">
        <span>{icon}</span>
        {label}
      </div>
      {multiline ? (
        <textarea
          className="textarea !min-h-[70px]"
          rows={2}
          value={local}
          placeholder={placeholder}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local)}
        />
      ) : (
        <input
          className="input"
          value={local}
          placeholder={placeholder}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local)}
        />
      )}
    </label>
  );
}

function RowButton({
  icon,
  title,
  body,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all hover:border-default disabled:opacity-50"
      style={{
        background: "var(--bg-subtle)",
        borderColor: "var(--border-soft)",
      }}
    >
      <div
        className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
        style={{
          background: danger ? "rgba(239, 68, 68, 0.1)" : "var(--accent-soft)",
          color: danger ? "#dc2626" : "var(--accent-hover)",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="text-sm font-semibold"
          style={{ color: danger ? "#dc2626" : "var(--text-primary)" }}
        >
          {title}
        </div>
        <div className="text-[12px] text-secondary mt-0.5 leading-snug">{body}</div>
      </div>
    </button>
  );
}
