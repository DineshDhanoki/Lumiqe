/**
 * Sentry Client-Side Configuration.
 *
 * Captures unhandled errors, rejected promises, and performance data
 * from the browser. Requires NEXT_PUBLIC_SENTRY_DSN env var.
 *
 * Setup:
 *   1. npm install @sentry/nextjs
 *   2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 *   3. Set SENTRY_AUTH_TOKEN for source map uploads in CI
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

    // Only enable in production
    enabled: process.env.NODE_ENV === "production",

    // Sample 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,

    // Sample 100% of errors
    sampleRate: 1.0,

    // Capture unhandled promise rejections
    integrations: [
        Sentry.browserTracingIntegration(),
    ],

    // Filter out noisy errors
    ignoreErrors: [
        "ResizeObserver loop",
        "Network request failed",
        "Load failed",
        "AbortError",
    ],

    // Set environment tag
    environment: process.env.NODE_ENV || "development",
});
