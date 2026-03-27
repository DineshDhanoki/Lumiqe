/**
 * Lumiqe — Application Constants.
 *
 * All magic numbers, pricing, and configuration values that were
 * previously hardcoded in components. Change pricing here, not in JSX.
 */

// ─── Pricing (INR) ──────────────────────────────────────────

export const PRICING = {
    currency: 'INR',
    symbol: '₹',
    premium: {
        monthly: 149,
        annual: 1490,
    },
    credits: {
        scan: 29,
        analysis: 99,
        report: 199,
        bundle: 399,
    },
} as const;

// ─── Camera / CV Thresholds ─────────────────────────────────

export const CAMERA = {
    captureCountdown: 3,
    holdStillDelayMs: 1500,
    lightingThresholds: {
        tooDark: 55,
        tooBright: 210,
    },
    frameCheckIntervalMs: 500,
    maxImageSizeMB: 5,
    maxMultiImages: 5,
} as const;

// ─── User / Profile ─────────────────────────────────────────

export const PROFILE = {
    rescanThresholdDays: 60,
    freeScansDefault: 3,
} as const;

// ─── API Limits ─────────────────────────────────────────────

export const API_LIMITS = {
    maxChatHistoryLength: 20,
    maxChatMessageLength: 500,
} as const;
