/**
 * Lumiqe — Analytics (PostHog).
 *
 * Tracks key conversion events. PostHog is only loaded when
 * NEXT_PUBLIC_POSTHOG_KEY is set — zero overhead in dev.
 */

type EventProperties = Record<string, string | number | boolean | null>;

let posthog: { capture: (event: string, properties?: EventProperties) => void } | null = null;

export async function initAnalytics(): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    const ph = (await import("posthog-js")).default;
    ph.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
    });
    posthog = ph;
  } catch {
    // PostHog not installed or blocked — fail silently
  }
}

export function track(event: string, properties?: EventProperties): void {
  posthog?.capture(event, properties);
}

// ─── Backend event tracking (fire-and-forget) ──────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function trackBackend(eventName: string, properties?: EventProperties): void {
  try {
    fetch(`${API_BASE}/api/events/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, properties }),
    }).catch(() => { /* silent */ });
  } catch { /* silent */ }
}

// ─── Predefined Events ──────────────────────────────────────

export const events = {
  analysisStarted: () => {
    track("analysis_started");
    trackBackend("analysis_started");
  },

  scanCompleted: (season: string, confidence: number) => {
    track("scan_completed", { season, confidence });
    trackBackend("analysis_completed", { season, confidence });
  },

  checkoutStarted: (plan: string) => {
    track("checkout_started", { plan });
    trackBackend("checkout_started", { plan });
  },

  checkoutCompleted: (plan: string) => {
    track("checkout_completed", { plan });
    trackBackend("checkout_completed", { plan });
  },

  productClicked: (productUrl: string, category: string) => {
    track("product_clicked", { product_url: productUrl, category });
    trackBackend("product_clicked", { category });
  },

  shareCreated: (platform: string) => {
    track("share_created", { platform });
    trackBackend("share_created", { platform });
  },

  quizCompleted: (quizType: string, result: string) => {
    track("quiz_completed", { quiz_type: quizType, result });
    trackBackend("quiz_completed", { quiz_type: quizType, result });
  },

  creditsPurchased: (amount: number) => {
    track("credits_purchased", { amount });
    trackBackend("credits_purchased", { amount });
  },
};
