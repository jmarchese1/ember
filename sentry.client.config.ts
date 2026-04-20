import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    // Don't spam Sentry with expected "user not signed in" or "daily limit" errors.
    ignoreErrors: [
      "sign in required",
      "daily limit reached",
      "pro required",
      "Session expired",
      "AbortError",
    ],
  });
}
