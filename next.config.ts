import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// Only wrap with Sentry if an auth token + org/project is configured.
// Without these, `withSentryConfig` still compiles cleanly and the SDK stays
// a no-op thanks to the missing DSN guards in sentry.*.config.ts.
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: false,
};

export default withSentryConfig(nextConfig, sentryBuildOptions);
