# Lumiqe — Brutal Codebase Evaluation

> **Generated:** April 6, 2026 | **Commit:** post-monolith-split + security hardening
> **Purpose:** Comprehensive audit with line-level detail. Every finding verified by reading actual source.

---

## Table of Contents

- [Scorecard](#scorecard)
- [Priority Action Board](#priority-action-board)
- [1. Architecture](#1-architecture)
- [2. Code Quality](#2-code-quality)
- [3. Missing Features](#3-missing-features)
- [4. Security & Performance](#4-security--performance)
- [5. Tech Debt](#5-tech-debt)
- [6. Investor Readiness](#6-investor-readiness)
- [7. Complete File Inventory](#7-complete-file-inventory)
- [8. Test Coverage Assessment](#8-test-coverage-assessment)
- [9. Infrastructure Readiness](#9-infrastructure-readiness)
- [10. File-Level Issue Index](#10-file-level-issue-index)

---

## Scorecard

| Dimension | Score | Key Blocker |
|-----------|-------|-------------|
| Architecture | 7/10 | No async task queue in analyze endpoint; wardrobe serialization O(n×m) |
| Code Quality | 6/10 | 4 components still > 300 lines; 6 backend functions > 30 lines |
| Missing Features | 5/10 | No password reset; no email verification flow; no wardrobe UI |
| Security | 6/10 | Proxy path allowlist loose; CSRF absent; credit amount needs validation |
| Performance | 6/10 | CV pipeline blocks threads; no pgvector index; no query caching |
| Tech Debt | 6/10 | Coverage thresholds low (40-50%); sealed secrets are placeholders |
| Test Coverage | 6/10 | Backend 65% (42 files); frontend ~30% (50 files); 6 E2E tests exist |
| Infrastructure | 7/10 | Backups, monitoring, HPA, TLS all exist; missing failover automation |
| Investor Readiness | 6.5/10 | Strong CV pipeline; test suite exists; K8s ready; security holes remain |
| **Overall** | **6/10** | **Improved from 5.5. Critical P0s down from 5 to 2.** |

---

## Priority Action Board

### P0 — Fix Before Any Deployment

| # | Action | File | Line | Effort | Status |
|---|--------|------|------|--------|--------|
| 1 | ~~Fix Stripe webhook error response (was returning non-200 to Stripe)~~ | `backend/app/api/stripe.py` | 278 | 5 min | ✅ FIXED |
| 2 | ~~Add credit amount range validation (1-100)~~ | `backend/app/api/stripe.py` | 279-282 | 5 min | ✅ FIXED |
| 3 | ~~Delete mock endpoints returning fake data~~ | `frontend/src/app/api/analyze/route.ts` | — | 5 min | ✅ ALREADY GONE |
| 4 | ~~Validate image proxy Content-Type against allowlist~~ | `frontend/src/app/api/image-proxy/route.ts` | 79-84 | 15 min | ✅ FIXED |
| 5 | Tighten API proxy path allowlist (remove `admin/`, use exact matching) | `frontend/src/app/api/proxy/[...path]/route.ts` | 34-41 | 30 min | ❌ OPEN |
| 6 | Add Google OAuth `iss` (issuer) validation | `backend/app/api/auth.py` | 170-174 | 10 min | ❌ OPEN |

### P1 — Fix Before Scaling Past 100 Users

| # | Action | File | Line | Effort | Status |
|---|--------|------|------|--------|--------|
| 7 | ~~Add `USER` directive to backend Dockerfile~~ | `backend/Dockerfile` | 16-17 | 5 min | ✅ FIXED |
| 8 | ~~Add `imagePullPolicy: Always` to K8s deployments~~ | `k8s/*.yaml` | 24 | 5 min | ✅ FIXED |
| 9 | Add pgvector index on `color_embedding` column | `backend/app/models.py` | 241 | 30 min | ❌ OPEN |
| 10 | Add missing DB indexes: `created_at` on AnalysisResult, `stripe_customer_id` on User | `backend/app/models.py` | 126, 48 | 30 min | ❌ OPEN |
| 11 | Add CSRF protection middleware | `backend/app/main.py` | 121-127 | 1 hr | ❌ OPEN |
| 12 | Validate `user_tier` query param as enum (prevent free users passing `premium`) | `backend/app/api/products.py` | 176 | 10 min | ❌ OPEN |
| 13 | Validate user_id exists before granting credits in webhook | `backend/app/api/stripe.py` | 279 | 10 min | ❌ OPEN |
| 14 | Raise CI coverage thresholds (currently 40% backend, 50% frontend) | `.github/workflows/ci.yml` | 39, 114 | 5 min | ❌ OPEN |

### P2 — Fix Before 1k Users

| # | Action | File | Effort | Status |
|---|--------|------|--------|--------|
| 15 | ~~Split 500+ line frontend components (dashboard, analyze, results)~~ | — | 1-2 days | ✅ DONE |
| 16 | Split remaining oversized components (SignInModal 472, account/page 535) | `components/SignInModal.tsx`, `app/account/page.tsx` | 1 day | ❌ OPEN |
| 17 | Implement async task queue for CV pipeline (Celery is in docker-compose but analyze doesn't use it) | `backend/app/api/analyze.py` | 1-2 days | ❌ OPEN |
| 18 | Add Redis caching for product queries | `backend/app/repositories/product_repo.py` | 1 day | ❌ OPEN |
| 19 | Refactor community report counting to SQL (currently fetches ALL events, filters in Python) | `backend/app/api/community_moderation.py` | 98-110 | 1 hr | ❌ OPEN |
| 20 | Cache wardrobe match scores (currently recalculates Delta-E per item per request) | `backend/app/api/wardrobe.py` | 139-155 | 1 day | ❌ OPEN |
| 21 | Validate portal_url domain before redirect in account page | `frontend/src/app/account/page.tsx` | 73 | 15 min | ❌ OPEN |
| 22 | Fix URL.createObjectURL memory leak in analyze page | `frontend/src/app/analyze/page.tsx` | 108 | 15 min | ❌ OPEN |
| 23 | Centralize duplicate `timeAgo()` function | `NotificationBell.tsx` + `AnalysisHistory.tsx` | 15 min | ❌ OPEN |
| 24 | Seal K8s secrets with `kubeseal` (currently placeholder strings) | `k8s/sealed-secrets.yaml` | 40-50 | 30 min | ❌ OPEN (needs cluster) |

### P3 — Fix Before 10k Users

| # | Action | Effort |
|---|--------|--------|
| 25 | Implement API versioning (`/api/v2/`) | 1 day |
| 26 | Add Postgres automated failover (Patroni) | 2-3 days |
| 27 | Move i18n strings to JSON per locale (currently 68KB inline file) | 1 day |
| 28 | Add security scanning to CI (Semgrep/Snyk) | 2 hr |
| 29 | Add WCAG 2.1 AA accessibility compliance | 3-5 days |
| 30 | Implement circuit breaker for external services (Groq, Stripe, Resend) | 1 day |
| 31 | Add WAL archiving for point-in-time recovery | 1 day |
| 32 | Convert training notebook to reproducible Python module with MLflow | 2 days |

---

## 1. Architecture

### Overall Verdict: Survives 1k users. Needs targeted fixes for 10k.

### What's solid

- **Clean layered backend:** API → Services → Repositories → Models with proper separation
- **CV pipeline is real engineering:** BiSeNet → K-Means++ on a\*b\* → ITA angle → Delta-E CIE2000
- **Server-side JWT proxy:** `frontend/src/app/api/proxy/[...path]/route.ts` keeps tokens out of client JS
- **K8s production-ready:** HPA (2-10 pods), StatefulSet Postgres with 2 replicas, TLS Ingress, sealed secrets framework
- **Rate limiter uses Lua script:** `backend/app/core/rate_limiter.py:107-123` — atomic sliding window, no race conditions
- **Celery + Redis task queue exists:** `docker-compose.yml`, `k8s/celery-worker.yaml` (2-20 pods, HPA)
- **Monitoring stack defined:** `k8s/prometheus-config.yaml`, `k8s/grafana.yaml` with alerting rules
- **Backup automation:** `k8s/postgres-backup.yaml` — daily CronJob, 30-day retention

### What breaks under load

**CV pipeline doesn't use the task queue.** `backend/app/api/analyze.py:182-261` runs analysis synchronously despite Celery being configured. The endpoint blocks a Uvicorn worker thread for the entire CV operation. At 100 concurrent users, most wait.

**No pgvector index.** `backend/app/models.py:241` — `color_embedding` cosine distance is O(N). Past 5k products, every outfit recommendation crawls.

**Wardrobe serialization is O(items × colors).** `backend/app/api/wardrobe.py:139-155` — `_score_against_palette()` calculates Delta-E for every palette color on every item, on every GET. 100 items × 12 colors = 1,200 color distance calculations per page load. No caching.

**Community report counting fetches ALL events.** `backend/app/api/community_moderation.py:98-110` — queries every `community_report` event, filters in Python. Should be a WHERE clause.

**Product fallback does 3 sequential DB queries.** `backend/app/repositories/product_repo.py:141-174` — exact match, siblings, universal. Should be a single UNION query.

### Decisions you'll regret

| Decision | Why it hurts later |
|----------|-------------------|
| No API versioning | First breaking change forces all clients to update simultaneously |
| State scattered across useState, Zustand, localStorage, URL params | Cross-device sync requires rewriting data flow |
| `user_tier` query param not validated | Attacker passes `user_tier=premium` to bypass paywall (`products.py:176`) |
| Training code is a Jupyter notebook | Model can't be reproduced if Colab environment changes |
| Prometheus uses `emptyDir` storage | Monitoring data lost on pod restart |

---

## 2. Code Quality

### Overall Verdict: Backend decent. Frontend improved but still has structural problems.

### Backend function length violations (CLAUDE.md: max 30 lines)

| Function | File | Lines | Count |
|----------|------|-------|-------|
| `stripe_webhook()` | `app/api/stripe.py` | 213-340 | 132 |
| `add_wardrobe_item()` | `app/api/wardrobe.py` | 208-332 | 125 |
| `analyze_multi_image()` | `app/api/analyze.py` | 99-211 | 113 |
| `get_products_filtered()` | `app/api/products.py` | 165-262 | 97 |
| `analyze_image()` | `app/api/analyze.py` | 182-261 | 78 |
| `generate_card()` | `app/services/palette_card.py` | — | ~210 |
| `generate_square_card()` | `app/services/palette_card.py` | — | ~200 |
| `wardrobe_compatibility()` | `app/api/wardrobe.py` | — | 54 |

### Frontend oversized components

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| account/page.tsx | `app/account/page.tsx` | **535** | ❌ Needs split |
| SignInModal.tsx | `components/SignInModal.tsx` | **472** | ❌ Needs split |
| CameraCapture.tsx | `components/CameraCapture.tsx` | **292** | ⚠️ Borderline |
| analyze/page.tsx | `app/analyze/page.tsx` | 268 | ✅ Recently split from 610 |
| ResultsView.tsx | `components/ResultsView.tsx` | 255 | ✅ Recently split from 456 |
| dashboard/page.tsx | `app/dashboard/page.tsx` | 216 | ✅ Recently split from 604 |

### Specific code issues

**Broad exception catching.** `stripe.py:248`, `shopping_agent.py:156-165` — `except Exception as exc:` catches SystemExit, KeyboardInterrupt, masks root causes.

**Fire-and-forget emails.** `backend/app/api/auth.py:77-84` — welcome emails sent via `run_in_executor()` with no error handling. Silent failures.

**Password strength meter is decorative.** `frontend/src/components/SignInModal.tsx:21-33` — 8-char password with uppercase + digit + special = "strong" (score 4/5). No entropy check, no zxcvbn.

**Gift code generation race condition.** `backend/app/api/gift.py:103-111` — check-then-insert pattern on `_gift_codes` dict is not atomic under concurrent requests.

**In-memory notification ID counter.** `backend/app/api/notifications.py:78-81` — `_id_counter += 1` without lock. Resets on restart. Should use UUID.

**B2B rate limiter uses FIFO eviction.** `backend/app/api/b2b_api.py:99-103` — when at 10k keys, evicts oldest (not least-recently-used). Active keys can be evicted.

---

## 3. Missing Features

Based on what competitors (Color Me Beautiful, Dressika, Style DNA) offer:

| Feature | Status | Impact |
|---------|--------|--------|
| **Password reset flow** | Missing entirely | Users locked out permanently |
| **Email verification** | DB column exists (`email_verified`), flow missing | Can't verify identity |
| **Wardrobe management UI** | Backend schema + API exists, frontend skeletal | No retention hook |
| **Virtual try-on / AR** | `backend/app/api/try_on.py` returns static SVG overlay | Competitors have real AR |
| **Before/after comparison** | `backend/app/api/before_after.py` generates static PNG | No interactive slider |
| **Social sharing flow** | OG image exists, share buttons exist, but no Instagram-ready export | Missing viral loop |
| **Push notifications** | Missing | No re-engagement |
| **Offline mode** | Service worker registered, does nothing useful | PWA promise unfulfilled |
| **WCAG 2.1 AA accessibility** | Skip link + some ARIA, but almost zero compliance | Legal liability |
| **Price drop alerts** | `PriceAlert` model exists, no implementation | Missing revenue opportunity |

**The retention problem is existential.** Users analyze once, maybe browse products, then have no reason to return. The wardrobe + daily outfit features are backend-complete but frontend-incomplete. This is the single biggest gap.

---

## 4. Security & Performance

### Top 5 security issues still open

**1. API proxy uses loose prefix matching.** `frontend/src/app/api/proxy/[...path]/route.ts:34-41`

```typescript
const ALLOWED_PREFIXES = [
    'auth/', 'analyze', 'scan-item', ..., 'admin/', 'b2b/', ...
];
if (!ALLOWED_PREFIXES.some(prefix => apiPath.startsWith(prefix)))
```

`admin/` matches `admin-exploit/anything`. `auth/` matches `auth-bypass/`. Should use exact path segments or regex with word boundaries.

**2. No CSRF protection.** Backend `app/main.py:121-127` has CORS but no CSRF tokens. Frontend proxy forwards Origin header but doesn't add CSRF tokens to state-changing requests.

**3. Google OAuth missing issuer validation.** `backend/app/api/auth.py:170-174` — validates `aud` (audience) but not `iss` (issuer). Should check `iss == "https://accounts.google.com"`.

**4. `user_tier` param is unvalidated.** `backend/app/api/products.py:176` — `user_tier: str = Query("free")` accepts any string. Pass `user_tier=premium` to see premium product vibes without paying.

**5. Open redirect in account page.** `frontend/src/app/account/page.tsx:73` — `window.location.href = data.portal_url` without verifying it's a Stripe domain. Backend compromise → phishing redirect.

### Top 3 performance issues

**1. CV pipeline blocks Uvicorn workers.** `backend/app/api/analyze.py:182-261` — synchronous processing despite Celery being available. Fix: submit to Celery, return job ID, poll for result.

**2. No query caching.** Identical product queries, palette lookups, season mappings hit PostgreSQL every time. No Redis cache layer despite Redis being available.

**3. Dashboard waterfall.** `frontend/src/app/dashboard/page.tsx:91-150` — two separate `useEffect` hooks make sequential API calls (`/api/analysis/` then `/api/daily-outfit`). Should use `Promise.all()`.

---

## 5. Tech Debt

| Debt | Where | Cost now | Cost in 3 months |
|------|-------|----------|-------------------|
| CI coverage thresholds 40-50% | `.github/workflows/ci.yml:39,114` | 5 min to raise | Tests drift; bugs "pass CI" |
| Sealed secrets are placeholder strings | `k8s/sealed-secrets.yaml:40-50` | 30 min (needs cluster) | Cluster deployment fails silently |
| Prometheus uses emptyDir storage | `k8s/prometheus-config.yaml` | 2 hr | Monitoring data lost on restart |
| ESLint rules downgraded to warnings | `frontend/eslint.config.mjs:16-28` | 30 min | 48 warnings accumulate; `any` spreads |
| Training code is notebook only | `training/season_classifier_colab.ipynb` | 2 days | Can't retrain model; no data versioning |
| SDK covers only 3 of ~10 B2B endpoints | `sdk/lumiqe_sdk/client.py` | 1 day | B2B clients can't use half your API |
| localStorage used as database for quiz/history | Multiple frontend files | 1 day | Cross-device sync requires full rewrite |
| Duplicate `timeAgo()` function | `NotificationBell.tsx` + `AnalysisHistory.tsx` | 15 min | Copy-paste bugs diverge |
| Frontend deps use caret versions | `frontend/package.json:17-49` | 5 min | Minor version breaks build unpredictably |
| No migration up/down tests | `backend/alembic/versions/` (17 files) | 1 day | Failed migration = production down |

---

## 6. Investor Readiness

### Score: 6.5/10 (up from 6/10)

### What impresses

| Signal | Why it matters |
|--------|---------------|
| CV pipeline with real computer science (BiSeNet + K-Means++ + ITA + Delta-E 2000) | Technical moat — not an API wrapper |
| 379 backend tests across 42 files | Engineering discipline |
| K8s manifests with HPA + Postgres replication + TLS + monitoring | Production thinking |
| Security spec document (260 lines of threat modeling) | Security awareness |
| Rate limiter uses atomic Lua scripts | Correct distributed systems thinking |
| B2B SDK with zero-dependency design | Platform thinking |
| Celery + backup CronJob + Grafana alerting | Operational maturity |

### What makes them close the laptop

| Red flag | Why it kills the deal |
|----------|----------------------|
| **`user_tier` param is unvalidated** | Paywall can be bypassed by passing a query parameter. Basic. |
| **CI coverage at 40-50%** | 379 tests exist but only need to cover 40% of code. Safety net has holes. |
| **Sealed secrets are placeholder strings** | K8s secrets management doesn't actually work. Anyone who reads the YAML sees this. |
| **2 components still over 470 lines** | SignInModal (472) and account page (535) show bus factor = 1. |
| **No password reset or email verification** | Basic auth flows missing. Users get locked out permanently. |
| **Training code is a Jupyter notebook** | Model can't be reproduced. If the notebook breaks, the core ML is gone. |
| **Zero WCAG accessibility** | Legal liability. ADA lawsuits cost more than building it right. |

---

## 7. Complete File Inventory

### Backend (~14,500 lines across 44 API files)

**API Layer:**

| File | Lines | Endpoints | Auth | Issues |
|------|-------|-----------|------|--------|
| `api/analyze.py` | ~261 | `POST /analyze`, `POST /analyze/multi` | Optional | Anonymous unlimited scans; functions >30 lines |
| `api/auth.py` | ~300 | Register, Login, Google, Refresh, Me, Delete | Mixed | Missing `iss` validation on Google OAuth |
| `api/stripe.py` | 365 | Checkout, Buy-credits, Webhook, Portal | Mixed | ✅ Credits validated; 132-line webhook function |
| `api/products.py` | ~262 | GET products (filtered) | No | `user_tier` unvalidated; 97-line function |
| `api/shopping_agent.py` | ~165 | GET curated outfit | Yes | Missing try/except on affiliatize_url |
| `api/wardrobe.py` | ~332 | CRUD wardrobe items, compatibility | Yes | O(n×m) serialization; 122-line function |
| `api/community.py` | ~157 | CRUD posts, like, feed | Mixed | Weak profanity filter |
| `api/community_moderation.py` | ~210 | Reports, admin | Admin | Full table scan for report counting |
| `api/color_chat.py` | ~208 | POST color chat | Yes | LLM output not HTML-escaped |
| `api/gift.py` | ~125 | Create, Redeem | Yes | Race condition on code generation |
| `api/outfit.py` | ~81 | Daily outfit | Yes | Clean |
| `api/notifications.py` | ~81 | CRUD notifications | Yes | Non-atomic ID counter |
| `api/b2b_api.py` | ~103 | B2B analyze, keys, usage | B2B Key | FIFO eviction, memory leak potential |
| `api/health.py` | ~86 | Health check | No | CV engine state not invalidated |
| `api/makeup.py` | ~164 | Shades, recommendations | No | Clean |
| `api/wishlist.py` | ~116 | CRUD wishlist | Yes | Clean |
| `api/saved_outfits.py` | ~51 | CRUD saved outfits | Yes | Clean |
| `api/affiliate_tracking.py` | ~66 | Click tracking | No | Silent "unknown" domain fallback |
| `api/before_after.py` | ~141 | Comparison image | No | Hardcoded dimensions |
| `api/stories.py` | ~125 | Stories card | No | Silent palette truncation |
| `api/try_on.py` | ~64 | Virtual try-on | No | Static SVG overlay |
| `api/referral.py` | ~62 | Referral tracking | Yes | Clean |
| `api/skin_profiles.py` | ~44 | Skin profile CRUD | Yes | Clean |
| `api/price_alerts.py` | ~71 | Price alerts | Yes | Clean |

**Core Layer:**

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `core/config.py` | 108 | Settings with Pydantic | Hardcoded DB URL default `postgres:postgres` (line 21) |
| `core/rate_limiter.py` | 194 | Redis sliding window | ✅ Atomic Lua script; production fails-closed |
| `core/security.py` | ~183 | Headers, file validation, LLM sanitizer | Decompression bomb check is post-read (line 120) |
| `core/token_utils.py` | ~168 | JWT token management | Race condition in capacity eviction (line 160-168) |
| `core/dependencies.py` | ~50 | FastAPI DI | Clean |
| `core/celery_app.py` | ~40 | Celery configuration | Clean |

**Services Layer:**

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `services/palette_card.py` | ~420 | Palette card image generation | 210+ line functions (2x) |
| `services/color_matcher.py` | ~308 | Delta-E CIE2000, color naming | O(N) color name lookup (line 292-308) |
| `services/email.py` | ~48 | Email sending via Resend | Silent failure, no retry |
| `services/scraper.py` | ~73 | Product scraping | Broad except Exception |
| `services/shopping_agent_service.py` | — | Outfit curation | — |

**CV Pipeline:**

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `cv/color_analysis.py` | ~271 | Core color extraction | GT mask cache ~64MB, no eviction |
| `cv/pipeline.py` | — | Orchestration | — |
| `cv/lighting.py` | — | Image lighting validation | — |

**Models:**

| Model | Table | Key Fields | Missing Indexes |
|-------|-------|------------|-----------------|
| User | `users` | email, hashed_password, is_premium, stripe_customer_id | ❌ `stripe_customer_id` |
| AnalysisResult | `analysis_results` | user_id, season, hex_color, confidence | ❌ `created_at` |
| Product | `products` | season, gender, vibe, color_embedding, is_active | ❌ compound `(season, gender, vibe, is_active)`, ❌ pgvector index |
| WardrobeItem | `wardrobe_items` | user_id, name, color_hex, category | ✅ |
| WishlistItem | `wishlist_items` | user_id, product_url | ✅ |
| SavedOutfit | `saved_outfits` | user_id, items JSON | ✅ |
| Event | `events` | event_name, properties JSONB | ✅ |
| B2BKey | `b2b_keys` | api_key_hash, user_id | ✅ |

### Frontend (~128 TypeScript files)

**Pages:**

| File | Lines | State Pattern | Issues |
|------|-------|---------------|--------|
| `app/analyze/page.tsx` | 268 | useState + Zustand + localStorage | URL.createObjectURL not revoked |
| `app/dashboard/page.tsx` | 216 | useState + Zustand + localStorage fallback | Waterfall API calls |
| `app/results/page.tsx` | 128 | useSearchParams + localStorage | Race condition (empty deps array uses searchParams) |
| `app/results/[id]/page.tsx` | 90 | API fetch | Clean |
| `app/account/page.tsx` | **535** | useState + API fetch | ❌ Open redirect (line 73); needs split |
| `app/quiz/body-shape/page.tsx` | 318 | useState + localStorage | No TTL on stored data |
| `app/quiz/style/page.tsx` | 350 | useState + localStorage | No TTL on stored data |
| `app/pricing/page.tsx` | 26 | — | Clean |
| `app/seasons/[season]/page.tsx` | 272 | Static data | dangerouslySetInnerHTML for JSON-LD (safe—static data) |

**Components:**

| File | Lines | Issues |
|------|-------|--------|
| `components/SignInModal.tsx` | **472** | ❌ Needs split; weak password meter |
| `components/CameraCapture.tsx` | 292 | Stream cleanup on unmount ✅; rapid flip may leak |
| `components/ResultsView.tsx` | 255 | ✅ Recently split from 456 |
| `components/NotificationBell.tsx` | 247 | Duplicate `timeAgo()` |
| `components/Pricing.tsx` | 330 | Payment logic mixed with UI |
| `components/ProductCard.tsx` | 209 | dangerouslySetInnerHTML for CSS keyframes (safe—static) |
| `components/analyze/AnalyzingSpinner.tsx` | — | ✅ New (from split) |
| `components/analyze/ModeChooser.tsx` | — | ✅ New (from split) |
| `components/analyze/UploadDropzone.tsx` | — | ✅ New (from split) |
| `components/analyze/MultiPhotoUpload.tsx` | — | ✅ New (from split) |
| `components/dashboard/RescanNudge.tsx` | — | ✅ New (from split) |
| `components/dashboard/StyleIdentityCards.tsx` | — | ✅ New (from split) |
| `components/dashboard/TodaysOutfit.tsx` | — | ✅ New (from split) |
| `components/dashboard/QuickActions.tsx` | — | ✅ New (from split) |
| `components/dashboard/DiscoveryQuizzes.tsx` | — | ✅ New (from split) |
| `components/dashboard/SkincareGuide.tsx` | — | ✅ New (from split) |
| `components/dashboard/AnalysisHistory.tsx` | — | ✅ New (from split) |
| `components/dashboard/EmptyCTA.tsx` | — | ✅ New (from split) |
| `components/results/OverviewTab.tsx` | — | ✅ New (from split) |

**API Routes:**

| File | Lines | Issues |
|------|-------|--------|
| `app/api/proxy/[...path]/route.ts` | 102 | ❌ Loose prefix matching on allowlist |
| `app/api/image-proxy/route.ts` | 107 | ✅ Content-Type validated, size limited, domain allowlisted |
| `app/api/auth/[...nextauth]/route.ts` | 6 | Delegates to lib/auth.ts |

**Lib:**

| File | Lines | Purpose | Issues |
|------|-------|---------|--------|
| `lib/api.ts` | 48 | API fetch wrapper | No built-in timeout |
| `lib/auth.ts` | 180 | NextAuth config | ✅ Token refresh rotation; server-side JWT |
| `lib/i18n.ts` | ~2000+ | Inline translations (10 languages) | 68KB; should be JSON per locale |
| `lib/imageUtils.ts` | 60 | Compression + thumbnail | sessionStorage for photos (cleared on tab close) |
| `lib/store.ts` | ~100 | Zustand persist store | No TTL on persisted data |
| `lib/hooks/useCameraStream.ts` | 87 | Camera access | ✅ Proper cleanup |
| `lib/hooks/useLightingAnalysis.ts` | 125 | Brightness detection | ✅ Standard luminance formula |
| `lib/hooks/useTranslation.ts` | — | i18n hook | Clean |

**Config:**

| File | Lines | Issues |
|------|-------|--------|
| `middleware.ts` | 34 | ✅ Validates callbackUrl (`/` prefix, rejects `//`) |
| `next.config.ts` | 32 | ⚠️ `*.cdninstagram.com` wildcard in image domains |
| `eslint.config.mjs` | 33 | 8 rules downgraded to warnings |
| `tsconfig.json` | 36 | ✅ `strict: true` |
| `package.json` | 50 | Mix of pinned (React) and caret versions |

---

## 8. Test Coverage Assessment

### Backend Tests (42 files, ~5,231 lines, ~379 tests)

| Category | Files | Tests (est.) | Coverage | Quality |
|----------|-------|--------------|----------|---------|
| CV Pipeline | `test_cv_pipeline.py` (455 lines), `test_color_science.py` (171) | ~80 | 85% | ✅ Good |
| Auth & Security | `test_security.py` (237), `test_security_middleware.py` (184), `test_auth_models.py` (131) | ~50 | 85% | ✅ Good |
| API Integration | `test_api_integration.py` (251) | ~40 | 70% | Accepts 503 as pass ⚠️ |
| Stripe/Payments | `test_stripe_flows.py` (111), `test_stripe_webhook.py` (95) | ~20 | 50% | Shallow |
| Shopping/Products | `test_shopping_agent.py` (259), `test_product_repo.py` (63) | ~30 | 60% | Decent |
| Rate Limiting | `test_rate_limiter.py` (167) | ~20 | 70% | ✅ Good |
| Wardrobe/Outfits | `test_wardrobe.py` (61), `test_saved_outfits.py` (51), `test_daily_outfit_service.py` (107) | ~25 | 50% | Basic |
| Features | Celebrity, makeup, community, gift, referral, etc. | ~100+ | 50% | Mixed |

**Critical test gaps:**
- No E2E payment flow (register → trial → expire → subscribe → cancel)
- No concurrent request race condition tests
- No migration up/down tests
- API integration test accepts 503 (DB unavailable) as passing

### Frontend Tests (50 files, ~2,164 lines)

| Category | Files | Quality |
|----------|-------|---------|
| Component rendering | 44 | Mostly shallow (render + check text exists) |
| Hooks | 4 (useFetch, useTranslation, useModal, useFocusTrap) | ✅ Good |
| Zustand store | 1 (163 lines) | ✅ Most comprehensive unit test |
| Infrastructure | 7 (accessibility, error boundaries, constants, Dockerfile, share tracking, silent errors) | ✅ Good |
| E2E (Playwright) | 6 (auth, analyze, landing, results, navigation, mobile) | ✅ Exists but not in CI |
| Middleware | 1 (112 lines) | ✅ Good |
| API routes | 0 | ❌ Missing for proxy, image-proxy |

**Frontend coverage: ~30%** (50% CI threshold is being met, but many tests are shallow)

---

## 9. Infrastructure Readiness

### What exists

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| K8s backend | `k8s/backend-deployment.yaml` | ✅ | 3 replicas, HPA 2-10, security context, 4Gi memory |
| K8s frontend | `k8s/frontend-deployment.yaml` | ✅ | 2 replicas, Ingress, TLS |
| K8s Postgres | `k8s/postgres-replica.yaml` | ✅ | Primary + 2 replicas, streaming replication |
| K8s Celery | `k8s/celery-worker.yaml` | ✅ | 2-20 pods, HPA, Redis deployment included |
| K8s Backup | `k8s/postgres-backup.yaml` | ✅ | Daily CronJob, 30-day retention |
| K8s Monitoring | `k8s/prometheus-config.yaml`, `k8s/grafana.yaml` | ✅ | Prometheus + Grafana with alerting |
| K8s Secrets | `k8s/sealed-secrets.yaml` | ⚠️ | Placeholder values, not sealed |
| Docker Compose | `docker-compose.yml` | ✅ | Postgres, Redis, Backend, Celery, Frontend |
| Docker test | `docker-compose.test.yml` | ✅ | Isolated ports |
| Backend Dockerfile | `backend/Dockerfile` | ✅ | Non-root user (uid 1000) |
| Frontend Dockerfile | `frontend/Dockerfile` | ✅ | Multi-stage, non-root user (uid 1001) |
| CI Pipeline | `.github/workflows/ci.yml` | ✅ | Lint + typecheck + tests + audit |
| Alembic | `backend/alembic/` | ✅ | 17 migrations |
| Makefile | `Makefile` | ✅ | seal-secrets, deploy-backend, deploy-frontend |

### What's missing

| Missing | Impact | Effort |
|---------|--------|--------|
| Postgres failover automation (Patroni) | Manual promotion during outage | 2-3 days |
| WAL archiving for PITR | Backups are snapshots only; can't restore to arbitrary point | 1 day |
| Persistent Prometheus storage | Data lost on restart (uses emptyDir) | 2 hr |
| Frontend HPA | No auto-scaling for frontend (fixed at 2 replicas) | 30 min |
| Redis persistence config | `appendonly` not enabled in docker-compose | 5 min |
| Network policies | No inter-pod traffic restrictions | 1 hr |
| Pod disruption budgets | No graceful shutdown guarantees | 30 min |
| Security scanning in CI | No Semgrep, Snyk, or CodeQL | 2 hr |
| Backend mypy/pyright | No Python type checking in CI | 1 hr |

### K8s Resource Budget

| Component | CPU Req | Mem Req | CPU Limit | Mem Limit |
|-----------|---------|---------|-----------|-----------|
| Backend (×3) | 250m | 512Mi | 1 | 4Gi |
| Frontend (×2) | 100m | 256Mi | 500m | 512Mi |
| Celery (×2) | 500m | 2Gi | 2 | 4Gi |
| Postgres Primary | 500m | 1Gi | 2 | 4Gi |
| Postgres Replicas (×2) | 250m | 512Mi | 1 | 2Gi |
| Redis | 100m | 128Mi | 500m | 512Mi |
| Prometheus | 100m | 256Mi | 500m | 1Gi |
| Grafana | 100m | 128Mi | 500m | 512Mi |
| **Total Requests** | **3.15 CPU** | **8.3Gi** | | |
| **Total Limits** | **11 CPU** | **24.5Gi** | | |

---

## 10. File-Level Issue Index

### Backend — Every file with issues

| File | Issues | Priority |
|------|--------|----------|
| `app/api/auth.py:170-174` | Missing `iss` validation on Google OAuth | P0 |
| `app/api/products.py:176` | `user_tier` unvalidated — paywall bypass | P1 |
| `app/api/stripe.py:279` | No check user_id exists before granting credits | P1 |
| `app/api/analyze.py:182-261` | Synchronous CV despite Celery available; anonymous unlimited | P2 |
| `app/api/wardrobe.py:139-155` | O(n×m) Delta-E recalculation per request | P2 |
| `app/api/community_moderation.py:98-110` | Full table scan for report counting | P2 |
| `app/api/gift.py:103-111` | Race condition on code generation | P2 |
| `app/api/notifications.py:78-81` | Non-atomic ID counter without lock | P3 |
| `app/api/b2b_api.py:99-103` | FIFO eviction (not LRU) | P3 |
| `app/api/health.py:34-40` | CV engine state not invalidated after crash | P3 |
| `app/core/config.py:21` | Hardcoded `postgres:postgres` default | P2 |
| `app/core/token_utils.py:160-168` | Token store capacity race condition | P2 |
| `app/core/security.py:120` | Decompression bomb check is post-read | P2 |
| `app/cv/color_analysis.py:271` | GT mask cache ~64MB, no eviction | P2 |
| `app/models.py:241` | No pgvector index | P1 |
| `app/models.py:126` | No index on `created_at` | P1 |
| `app/models.py:48` | No index on `stripe_customer_id` | P1 |
| `app/services/palette_card.py` | 210+ line functions (2x) | P2 |
| `app/services/email.py:31-48` | Silent failure, no retry | P2 |
| `app/main.py:121-127` | No CSRF protection | P1 |

### Frontend — Every file with issues

| File | Issues | Priority |
|------|--------|----------|
| `src/app/api/proxy/[...path]/route.ts:34-41` | Loose prefix matching on path allowlist | P0 |
| `src/app/account/page.tsx:73` | Open redirect via `portal_url` | P2 |
| `src/app/account/page.tsx` | 535 lines — needs split | P2 |
| `src/app/results/page.tsx:79` | Race condition — empty deps array uses searchParams | P2 |
| `src/app/analyze/page.tsx:108` | URL.createObjectURL not revoked | P2 |
| `src/components/SignInModal.tsx` | 472 lines — needs split; weak password meter | P2 |
| `src/components/NotificationBell.tsx` + `AnalysisHistory.tsx` | Duplicate `timeAgo()` | P3 |
| `src/lib/i18n.ts` | 68KB inline translations | P3 |
| `next.config.ts:26` | Wildcard `*.cdninstagram.com` image domain | P2 |
| `eslint.config.mjs:16-28` | 8 rules downgraded to warnings | P3 |
| `.github/workflows/ci.yml:39,114` | Coverage thresholds too low (40%, 50%) | P1 |

### Infrastructure — Every file with issues

| File | Issues | Priority |
|------|--------|----------|
| `k8s/sealed-secrets.yaml:40-50` | Placeholder strings, not sealed | P2 |
| `k8s/prometheus-config.yaml` | emptyDir storage, data lost on restart | P2 |
| `k8s/postgres-replica.yaml:23` | `synchronous_commit = on` blocks on replica down | P2 |
| `k8s/postgres-replica.yaml` | No automatic failover (Patroni) | P3 |
| `frontend/package.json:17-49` | Mix of pinned and caret versions | P3 |
| `training/season_classifier_colab.ipynb` | Not reproducible; no Python module | P3 |

---

## What Changed Since Last Evaluation (March → April 2026)

### Improvements Made

| Change | Impact |
|--------|--------|
| Split 3 monolith components (dashboard 604→216, analyze 610→268, ResultsView 456→255) | 14 new focused sub-components |
| Added 97 tests for new components | Frontend test count: 29 → 50 files |
| Fixed Stripe webhook error response (now returns 200 OK) | Prevents infinite Stripe retry loop |
| Added credit amount range validation (1-100) | Prevents unlimited credit grants |
| Validated image proxy Content-Type against allowlist | Blocks XSS via proxied text/html |
| Added non-root user to backend Dockerfile | Matches K8s securityContext |
| Added `imagePullPolicy: Always` to K8s deployments | New builds actually pulled |
| Created Makefile with deploy + seal-secrets targets | Operational automation |
| Middleware validates callbackUrl (rejects `//`) | Open redirect partially mitigated |
| Mock endpoints deleted | No more fake "Deep Autumn" data |

### Score Movement

| Dimension | March | April | Change |
|-----------|-------|-------|--------|
| Architecture | 6.5 | 7 | +0.5 (Celery exists, backup CronJob added) |
| Code Quality | 5.5 | 6 | +0.5 (3 monoliths split) |
| Missing Features | 5 | 5 | — (no new features) |
| Security | 5 | 6 | +1 (image proxy, Stripe, Dockerfile, middleware) |
| Performance | 5 | 6 | +1 (image proxy timeout, K8s memory 4Gi) |
| Tech Debt | 5 | 6 | +1 (mock endpoints deleted, Makefile) |
| Test Coverage | 5 | 6 | +1 (97 new tests, 50 frontend files) |
| Infrastructure | 5 | 7 | +2 (backup CronJob, monitoring, Makefile) |
| Investor Readiness | 6 | 6.5 | +0.5 |
| **Overall** | **5.5** | **6** | **+0.5** |

---

*This evaluation should be revisited after addressing all P0 items and at least 50% of P1 items.*
