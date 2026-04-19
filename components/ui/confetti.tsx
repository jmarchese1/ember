"use client";
import { useEffect, useState } from "react";

const COLORS = ["#f59e0b", "#fbbf24", "#fcd34d", "#d97706", "#ea580c"];

interface Piece {
  id: number;
  left: number;
  cx: number;
  delay: number;
  color: string;
  rotate: number;
}

let idSeq = 1;

export function Confetti({ fire }: { fire: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!fire) return;
    const count = 36;
    const arr: Piece[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: idSeq++,
        left: Math.random() * 100,
        cx: (Math.random() - 0.5) * 240,
        delay: Math.random() * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotate: Math.random() * 360,
      });
    }
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 2200);
    return () => clearTimeout(t);
  }, [fire]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDelay: `${p.delay}s`,
            ["--cx" as string]: `${p.cx}px`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
