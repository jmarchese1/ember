import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #f59e0b 0%, #d97706 55%, #b45309 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="132" viewBox="0 0 32 36">
          <defs>
            <linearGradient id="appleOuter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="55%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
            <linearGradient id="appleInner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          <path
            d="M16 2 C19 8 25 11 25 18 C25 25 21 30 16 30 C11 30 7 25 7 18 C7 15 8 13 10 12 C10.5 15 12 16 13 15 C11.5 11 14 6 16 2 Z"
            fill="url(#appleOuter)"
          />
          <path
            d="M16 8 C18 12 22 15 22 20 C22 24.5 19.5 28 16 28 C12.5 28 10 24.5 10 20 C10 18 10.5 17 11.5 16.5 C11.7 18.5 13 19 14 18 C13 15 14.5 11 16 8 Z"
            fill="url(#appleInner)"
            opacity="0.9"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
