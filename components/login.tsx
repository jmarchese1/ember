"use client";
import { useState } from "react";
import {
  Flame,
  Mail,
  ArrowRight,
  CheckCircle2,
  Loader2,
  KeyRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "./ui/button";

type Stage = "email" | "code";

export function LoginScreen() {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) setError(error.message);
      else setStage("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.replace(/\D/g, "").slice(0, 6);
    if (clean.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase().auth.verifyOtp({
        email: email.trim(),
        token: clean,
        type: "email",
      });
      if (error) setError(error.message);
      // success → onAuthStateChange in page.tsx flips us into the app.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase().auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(700px 500px at 50% 20%, var(--accent-glow), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md fade-in">
        <div className="text-center mb-10">
          <div
            className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-5"
            style={{
              background:
                "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
              boxShadow: "0 10px 30px -8px var(--accent-glow)",
            }}
          >
            <Flame size={24} color="#fff" fill="#fff" strokeWidth={2} />
          </div>
          <h1
            className="display text-primary text-4xl md:text-5xl tracking-tight"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            Ember
          </h1>
          <p className="text-sm text-secondary mt-3 max-w-xs mx-auto leading-relaxed">
            A quiet fitness & wellness journal. Sign in to keep your streaks and reflections.
          </p>
        </div>

        <div className="card p-6 md:p-7">
          {stage === "email" && (
            <form onSubmit={sendCode} className="space-y-4">
              <label className="block">
                <div className="text-[11px] uppercase tracking-widest text-tertiary mb-2">
                  Your email
                </div>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none z-10"
                  />
                  <input
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </label>
              {error && <ErrorBanner message={error} />}
              <Button
                type="submit"
                disabled={loading}
                className="w-full !justify-center"
                icon={
                  loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )
                }
              >
                {loading ? "Sending…" : "Send sign-in email"}
              </Button>
              <p className="text-[11px] text-tertiary text-center leading-relaxed pt-1">
                No password. We&apos;ll email you a link and a code — use either.
              </p>
            </form>
          )}

          {stage === "code" && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent-hover)",
                }}
              >
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div className="text-[12.5px] leading-snug">
                  Email sent to{" "}
                  <span className="font-semibold">{email}</span>. Tap the link
                  OR paste the 6-digit code below.
                </div>
              </div>

              <label className="block">
                <div className="text-[11px] uppercase tracking-widest text-tertiary mb-2">
                  6-digit code
                </div>
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none z-10"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    className="input numeric text-center tracking-[0.4em] text-lg"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </label>

              {error && <ErrorBanner message={error} />}

              <Button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full !justify-center"
                icon={
                  loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )
                }
              >
                {loading ? "Verifying…" : "Sign in"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStage("email");
                    setCode("");
                    setError(null);
                  }}
                  className="text-[11px] text-tertiary hover:text-primary"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={resend}
                  disabled={loading}
                  className="text-[11px] text-accent hover:underline"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-[10px] text-tertiary uppercase tracking-[0.25em] text-center mt-8">
          small fires · long burns
        </p>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="text-xs p-3 rounded-lg"
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        color: "#dc2626",
        border: "1px solid rgba(239, 68, 68, 0.2)",
      }}
    >
      {message}
    </div>
  );
}
