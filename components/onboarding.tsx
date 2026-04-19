"use client";
import { useState } from "react";
import { Flame, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { setSettings } from "@/lib/storage";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goals, setGoals] = useState("");

  function finish() {
    setSettings({ name: name.trim() || undefined, goals: goals.trim() || undefined, onboarded: true });
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(12, 10, 9, 0.55)", backdropFilter: "blur(6px)" }}
    >
      <div className="card p-6 md:p-8 max-w-md w-full fade-in">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center"
            style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)" }}
          >
            <Flame size={17} color="#fff" fill="#fff" strokeWidth={2} />
          </div>
          <div>
            <div className="display text-primary text-lg tracking-tight">Welcome to Ember</div>
            <div className="text-[11px] text-tertiary uppercase tracking-widest">
              a quiet companion for the long game
            </div>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-secondary leading-relaxed">
              Pour your day into three text boxes — training, journal, diet. Write like
              you're texting a friend. Ember's AI cleans it into structured logs, surfaces
              patterns, and keeps a quiet flame for your streaks.
            </p>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-tertiary">
              <div className="p-3 rounded-lg text-center" style={{ background: "var(--bg-subtle)" }}>
                Write messy
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "var(--bg-subtle)" }}>
                Parse clean
              </div>
              <div className="p-3 rounded-lg text-center" style={{ background: "var(--bg-subtle)" }}>
                Show up
              </div>
            </div>
            <Button onClick={() => setStep(1)} icon={<ArrowRight size={15} />} className="w-full !justify-center">
              Begin
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="block">
              <div className="text-[11px] uppercase tracking-widest text-tertiary mb-2">
                What should we call you?
              </div>
              <input
                className="input"
                autoFocus
                placeholder="First name is fine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setStep(2);
                }}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Skip
              </Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="block">
              <div className="text-[11px] uppercase tracking-widest text-tertiary mb-2">
                What are you working toward?
              </div>
              <textarea
                className="textarea"
                rows={3}
                placeholder='"Feel stronger. Sleep better. Calmer mornings."'
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
              <p className="text-[11px] text-tertiary mt-2">
                Optional. This shapes the tone of your reflections.
              </p>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={finish}>
                Skip
              </Button>
              <Button onClick={finish}>Let's begin</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
