"use client";

const a = "var(--accent)";
const a2 = "var(--accent-hover)";
const soft = "var(--accent-soft)";
const line = "var(--border-default)";

export function TrainingIllustration() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden>
      <ellipse cx="70" cy="88" rx="52" ry="4" fill={soft} opacity="0.6" />
      {/* Barbell bar */}
      <rect x="14" y="54" width="112" height="4" rx="2" fill={line} />
      {/* Left plates */}
      <rect x="20" y="40" width="6" height="32" rx="2" fill={a} opacity="0.45" />
      <rect x="28" y="34" width="8" height="44" rx="2" fill={a} />
      <rect x="38" y="38" width="6" height="36" rx="2" fill={a2} opacity="0.7" />
      {/* Right plates */}
      <rect x="96" y="38" width="6" height="36" rx="2" fill={a2} opacity="0.7" />
      <rect x="104" y="34" width="8" height="44" rx="2" fill={a} />
      <rect x="114" y="40" width="6" height="32" rx="2" fill={a} opacity="0.45" />
      {/* Shine */}
      <line x1="32" y1="38" x2="34" y2="44" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="108" y1="38" x2="110" y2="44" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function DietIllustration() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden>
      <ellipse cx="70" cy="88" rx="52" ry="4" fill={soft} opacity="0.6" />
      {/* Plate */}
      <circle cx="70" cy="58" r="32" fill="var(--bg-subtle)" stroke={line} strokeWidth="1.5" />
      <circle cx="70" cy="58" r="26" fill={soft} opacity="0.5" />
      {/* Leaf */}
      <path d="M55 54 Q60 42 72 44 Q68 54 60 58 Q55 58 55 54 Z" fill={a} />
      <path d="M60 54 Q65 50 70 50" stroke={a2} strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Cherry tomato */}
      <circle cx="82" cy="60" r="6" fill={a2} />
      <path d="M82 54 Q82 52 84 51" stroke="#4a5930" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Grain */}
      <ellipse cx="74" cy="70" rx="7" ry="3" fill={a} opacity="0.7" />
    </svg>
  );
}

export function JournalIllustration() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden>
      <ellipse cx="70" cy="88" rx="52" ry="4" fill={soft} opacity="0.6" />
      {/* Book */}
      <rect x="32" y="30" width="76" height="54" rx="6" fill="var(--bg-subtle)" stroke={line} strokeWidth="1.5" />
      <line x1="70" y1="30" x2="70" y2="84" stroke={line} strokeWidth="1.5" />
      {/* Lines */}
      <line x1="40" y1="42" x2="64" y2="42" stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="40" y1="50" x2="60" y2="50" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="58" x2="64" y2="58" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="40" y1="66" x2="56" y2="66" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="76" y1="42" x2="100" y2="42" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="76" y1="50" x2="96" y2="50" stroke={a2} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <line x1="76" y1="58" x2="100" y2="58" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      {/* Star */}
      <path d="M112 28 L114 33 L119 33 L115 36 L117 41 L112 38 L107 41 L109 36 L105 33 L110 33 Z" fill={a} />
    </svg>
  );
}

export function DashboardIllustration() {
  return (
    <svg width="140" height="100" viewBox="0 0 140 100" fill="none" aria-hidden>
      <ellipse cx="70" cy="88" rx="52" ry="4" fill={soft} opacity="0.6" />
      {/* Rings */}
      <circle cx="50" cy="55" r="22" fill="none" stroke="var(--bg-subtle)" strokeWidth="5" />
      <circle cx="50" cy="55" r="22" fill="none" stroke={a} strokeWidth="5" strokeLinecap="round" strokeDasharray="80 200" transform="rotate(-90 50 55)" />
      <circle cx="50" cy="55" r="14" fill="none" stroke="var(--bg-subtle)" strokeWidth="4" />
      <circle cx="50" cy="55" r="14" fill="none" stroke={a2} strokeWidth="4" strokeLinecap="round" strokeDasharray="50 100" transform="rotate(-90 50 55)" />
      {/* Bars */}
      <rect x="86" y="56" width="6" height="20" rx="2" fill={a} opacity="0.6" />
      <rect x="96" y="48" width="6" height="28" rx="2" fill={a} />
      <rect x="106" y="42" width="6" height="34" rx="2" fill={a2} />
      <rect x="116" y="38" width="6" height="38" rx="2" fill={a} />
    </svg>
  );
}
