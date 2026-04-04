/**
 * Lumiqe — Analytics (PostHog).
 *
 * Tracks key conversion events. PostHog is only loaded when
 * NEXT_PUBLIC_POSTHOG_KEY is set — zero overhead in dev.
 */

type EventProperties = Record<string, string | number | boolean | null>;

interface PostHogInstance {
    init: (key: string, options: Record<string, unknown>) => void;
    capture: (event: string, properties?: EventProperties) => void;
}

interface WindowWithPostHog extends Window {
    posthog?: PostHogInstance;
}

let posthog: { capture: (event: string, properties?: EventProperties) => void } | null = null;

export async function initAnalytics(): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === 'undefined') return;

  try {
    // Load PostHog via CDN to avoid bundling it as a dependency
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://us-assets.i.posthog.com/static/array.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('PostHog script failed to load'));
      document.head.appendChild(script);
    });
    const ph = (window as WindowWithPostHog).posthog;
    if (ph) {
      ph.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
      });
      posthog = ph;
    }
  } catch {
    // PostHog blocked or unavailable — fail silently
  }
}

export function track(event: string, properties?: EventProperties): void {
  posthog?.capture(event, properties);
}

// ─── Backend event tracking (fire-and-forget) ──────────────

import { API_BASE } from '@/lib/api';

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
