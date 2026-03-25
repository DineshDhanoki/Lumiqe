# Lumiqe — Brutal Codebase Evaluation

> Generated: March 2026 | Commit: post-TDD + security hardening
> Purpose: Actionable reference for prioritized fixes before production launch.

---

## Table of Contents

- [Priority Action Board](#priority-action-board)
- [1. Architecture](#1-architecture)
- [2. Code Quality](#2-code-quality)
- [3. Missing Features](#3-missing-features)
- [4. Security & Performance](#4-security--performance)
- [5. Security Checklist](#5-security-checklist)
- [6. Tech Debt](#6-tech-debt)
- [7. Investor Readiness](#7-investor-readiness)
- [8. Test Coverage Assessment](#8-test-coverage-assessment)
- [9. Infrastructure Readiness](#9-infrastructure-readiness)
- [10. File-Level Issue Index](#10-file-level-issue-index)

---

## Priority Action Board

### P0 — Fix before any deployment

| # | Action | File | Line | Effort |
|---|--------|------|------|--------|
| 1 | Fix Stripe webhook idempotency (logic inverted — use `exists()` not `set(nx=True)`) | `backend/app/api/stripe.py` | 216-220 | 5 min |
| 2 | Add path allowlist to API proxy (currently forwards ANY path to backend) | `frontend/src/app/api/proxy/[...path]/route.ts` | 31-32 | 30 min |
| 3 | Validate callbackUrl in middleware (must start with `/`, block external URLs) | `frontend/src/middleware.ts` | 13 | 10 min |
| 4 | Delete mock endpoints that return fake data | `frontend/src/app/api/analyze/route.ts`, `frontend/src/app/api/products/route.ts` | entire files | 5 min |
| 5 | Make `GOOGLE_CLIENT_ID` required when Google auth is enabled | `backend/app/api/auth.py` | 176 | 15 min |

### P1 — Fix before scaling past 100 users

| # | Action | File | Line | Effort |
|---|--------|------|------|--------|
| 6 | Add `pytest` and `vitest` to CI pipeline | `.github/workflows/ci.yml` | — | 1 hr |
| 7 | Pin Docker image tags to git SHA (not `latest`) | `k8s/backend-deployment.yaml`, `k8s/frontend-deployment.yaml` | image tags | 30 min |
| 8 | Add pgvector index on `color_embedding` column | `backend/app/models.py` | 241 | 30 min |
| 9 | Add missing DB indexes: `created_at` on AnalysisResult, `stripe_customer_id` on User | `backend/app/models.py` | 126, 48 | 30 min |
| 10 | Add compound index on Product `(season, gender, vibe, is_active)` | `backend/app/models.py` | 228-234 | 15 min |
| 11 | Add request size limit + timeout to image proxy | `frontend/src/app/api/image-proxy/route.ts` | — | 30 min |
| 12 | Fix Redis rate limiter atomicity (use Lua script) | `backend/app/core/rate_limiter.py` | 86-89 | 1 hr |
| 13 | Add CSRF protection middleware | `backend/app/main.py` | 121-127 | 1 hr |
| 14 | Increase K8s memory limit to 4Gi, liveness probe delay to 120s | `k8s/backend-deployment.yaml` | 27, 34 | 15 min |

### P2 — Fix before 1k users

| # | Action | File | Effort |
|---|--------|------|--------|
| 15 | Split 500+ line frontend components (dashboard, camera, results, sign-in) | See Code Quality section | 1-2 days |
| 16 | Add Postgres backup automation (daily snapshots + PITR) | k8s infrastructure | 1 day |
| 17 | Implement async task queue for CV pipeline (Celery/Dramatiq) | `backend/app/api/analyze.py` | 1-2 days |
| 18 | Add Redis caching for product queries | `backend/app/repositories/product_repo.py` | 1 day |
| 19 | Refactor product fallback to single UNION query | `backend/app/repositories/product_repo.py:141-174` | 2 hr |
| 20 | Add observability stack (Prometheus + Grafana) | k8s infrastructure | 1-2 days |
| 21 | Replace localStorage state management with Zustand | Multiple frontend files | 1 day |
| 22 | Add E2E tests (Playwright) for critical flows | New test files | 2-3 days |

### P3 — Fix before 10k users

| # | Action | Effort |
|---|--------|--------|
| 23 | Implement API versioning (`/api/v2/`) | 1 day |
| 24 | Add Postgres automated failover (Patroni) | 2-3 days |
| 25 | Move i18n strings to JSON per locale | 1 day |
| 26 | Add security scanning to CI (Semgrep/Snyk) | 2 hr |
| 27 | Add accessibility compliance (WCAG 2.1 AA) | 3-5 days |
| 28 | Implement circuit breaker for external services (Groq, Stripe, Resend) | 1 day |

---

## 1. Architecture

### Overall Verdict: Survives 1k users. Chokes at 10k without targeted fixes.

### What's solid

- Clean layered backend: API -> Services -> Repositories -> Models
- Server-side JWT proxy pattern keeps tokens out of client JS
- CV pipeline is well-engineered: BiSeNet -> K-Means++ on a*b* -> ITA angle
- K8s manifests with HPA, StatefulSet Postgres replication, TLS ingress
- 19 Alembic migrations covering all features

### What breaks under load

**CV Pipeline Bottleneck**
- File: `backend/app/api/analyze.py:25`
- Problem: 4 thread workers. Request #5 queues. At 100 concurrent users, 96 wait with no timeout.
- Fix: Async task queue (Celery/Dramatiq) with configurable workers.

**No pgvector Index**
- File: `backend/app/models.py:241`
- Problem: `color_embedding` cosine distance scan is O(N). Past 5k products, every outfit request crawls.
- Fix: `CREATE INDEX ON products USING ivfflat (color_embedding vector_cosine_ops);`

**Product Fallback N+1**
- File: `backend/app/repositories/product_repo.py:141-174`
- Problem: 3 sequential DB queries per request (exact, siblings, universal).
- Fix: Single `UNION` query.

**In-Memory Rate Limiter**
- File: `backend/app/core/rate_limiter.py:19-20`
- Problem: Global dict, no lock, per-instance only. Redis pipeline not atomic (lines 86-89).
- Fix: Lua script for atomic Redis operations. Remove in-memory fallback in production.

**No Query Caching**
- Problem: Identical product listings, palette lookups, season mappings hit DB every time.
- Fix: Redis caching with 5-60min TTL depending on data freshness.

**GT Mask Cache Memory Pressure**
- File: `backend/app/cv/color_analysis.py:271`
- Problem: 256 entries * 512 * 512 bytes = ~64MB with no eviction.
- Fix: LRU cache with TTL.

### Decisions you'll regret

| Decision | Why it hurts later |
|----------|-------------------|
| No API versioning | First breaking change forces all clients to update simultaneously |
| Frontend state scattered (useState, localStorage, Zustand, URL params) | Cross-device sync requires rewriting data flow |
| 567-line dashboard page | Can't test, can't split, can't onboard new devs |
| No async task queue | Every analysis blocks a thread; can't scale horizontally |

---

## 2. Code Quality

### Overall Verdict: Backend decent. Frontend has structural problems.

### Backend — Function Length Violations (CLAUDE.md: max 30 lines)

| Function | File | Lines | Action |
|----------|------|-------|--------|
| `get_products_filtered()` | `backend/app/api/products.py` | 98 lines (165-262) | Split into 4 case functions |
| `generate_card()` | `backend/app/services/palette_card.py` | ~210 lines | Extract `_draw_header()`, `_draw_swatches()`, `_draw_footer()` |
| `generate_square_card()` | `backend/app/services/palette_card.py` | ~200 lines | Same treatment |
| `delta_e_cie2000()` | `backend/app/services/color_matcher.py` | ~90 lines | Extract hue/chroma/lightness weighting helpers |
| `score_and_rank()` | `backend/app/repositories/product_repo.py` | 184-290 | Extract scoring loop into helper |

### Backend — Error Handling Issues

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Broad `except Exception` catches SystemExit/KeyboardInterrupt | `scraper.py:73`, `shopping_agent.py:213`, `affiliate.py:86` | — | Catch specific exceptions |
| Fire-and-forget email, no retry | `auth.py:78` | 78 | Use task queue with retries |
| Error messages leak implementation details | `analyze.py:194` | 194 | Return generic message, log full error |
| Email service silently swallows failures | `services/email.py:31-48` | — | Log at ERROR level, add retry queue |

### Frontend — Oversized Components

| Component | File | Lines | Should become |
|-----------|------|-------|--------------|
| Dashboard | `app/dashboard/page.tsx` | 567 | DashboardContainer, DashboardContent, SkinCareGuide, StyleIdentityCards |
| CameraCapture | `components/CameraCapture.tsx` | 556 | CameraStream, LightingAnalyzer, CameraUI |
| ResultsView | `components/ResultsView.tsx` | 506 | ResultsOverview, ResultsTabNav, 5 tab components |
| SignInModal | `components/SignInModal.tsx` | 334 | SignInForm, SignUpForm, GoogleSignInButton |
| AnalyzePage | `app/analyze/page.tsx` | 338 | AnalyzeContainer, ModeChooser, CameraMode, UploadMode |
| AccountPage | `app/account/page.tsx` | 332 | ProfileSection, SubscriptionSection, StyleSection |

### Frontend — Specific Code Issues

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Mock endpoint returns fake "Deep Autumn" | `app/api/analyze/route.ts` | entire file | Delete file |
| Mock products endpoint | `app/api/products/route.ts` | entire file | Delete file |
| `URL.createObjectURL()` never revoked (memory leak) | `app/analyze/page.tsx` | 49 | Add `URL.revokeObjectURL()` on change/unmount |
| `dangerouslySetInnerHTML` for CSS | `components/ProductCard.tsx` | 200-206 | Use CSS Modules or Tailwind |
| Duplicate `timeAgo()` function | `NotificationBell.tsx` + `dashboard/page.tsx` | — | Move to `/lib/utils/time.ts` |
| `window.location.href` kills Next.js state | `SignInModal.tsx`, `account/page.tsx` | — | Use `router.push()` |
| Hardcoded "92% Style Rating" placeholder | `app/account/page.tsx` | — | Fetch from API or remove |
| Zustand vs localStorage race condition | `app/dashboard/page.tsx` | 145-207 | Wait for store hydration before rendering |

### Magic Numbers Without Constants

| Value | File | Line | Should be |
|-------|------|------|-----------|
| `KMeans(n_clusters=3)` | 3 different files | — | `KMEANS_CLUSTERS = 3` constant |
| `max_requests=50` / `max_requests=5` | `analyze.py` | 150 | Config: `MAX_PREMIUM_ANALYSES`, `MAX_FREE_ANALYSES` |
| `_MIN_CONFIDENCE_TO_DEDUCT = 0.5` | `analyze.py` | 22 | Move to `config.py` |
| Brightness thresholds 55/210 | `CameraCapture.tsx` | 128-132 | Named constants with documentation |

---

## 3. Missing Features

### Critical gaps vs competitors

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| Password reset flow | Missing | HIGH | 1 day |
| Email verification | Column exists, flow missing | HIGH | 1 day |
| Multi-photo analysis (3-5 selfies averaged) | Missing | HIGH | 2-3 days |
| Wardrobe management | Schema exists, UI skeletal | MEDIUM | 3-5 days |
| Saved favorites/wishlist UI | Schema exists, basic API | MEDIUM | 2 days |
| Price drop alerts | `PriceAlert` model exists, no implementation | MEDIUM | 2 days |
| Social sharing (Instagram-ready palette cards) | OG image exists, no share flow | MEDIUM | 1 day |
| Push notifications | Missing | MEDIUM | 2-3 days |
| Offline mode | SW registered, does nothing | LOW | 2-3 days |
| Virtual try-on / AR | Missing | LOW (high effort) | 2-4 weeks |
| Before/after comparison | Missing | LOW | 1 day |
| Accessibility (WCAG 2.1 AA) | Almost zero | HIGH | 3-5 days |

### Retention problem

No wardrobe management = no retention hook. Users analyze once, maybe generate an outfit, then have no reason to return. The daily outfit feature exists but doesn't connect to saved items.

---

## 4. Security & Performance

### Risk #1: Authentication & Authorization Gaps

| Vulnerability | File | Line | Severity | Fix |
|--------------|------|------|----------|-----|
| Google OAuth audience validation optional | `auth.py` | 176 | CRITICAL | Make `GOOGLE_CLIENT_ID` required when Google auth enabled |
| Open redirect after login | `middleware.ts` | 13 | CRITICAL | Validate callbackUrl starts with `/` |
| Open proxy (no path allowlist) | `proxy/[...path]/route.ts` | 31-32 | CRITICAL | Add `ALLOWED_PATHS` allowlist |
| No CSRF tokens on POST endpoints | `main.py` | 121-127 | HIGH | Add CSRF middleware |
| Rate limiter trusts X-Forwarded-For | `rate_limiter.py` | 136-140 | MEDIUM | Add `TRUSTED_PROXIES` config |
| No session invalidation on password change | — | — | MEDIUM | Revoke all tokens on password change |
| Name validator rejects non-Latin names | `schemas/user.py` | 19 | LOW | Allow Unicode |

### Risk #2: Resource Exhaustion

| Vulnerability | File | Line | Severity | Fix |
|--------------|------|------|----------|-----|
| Image proxy: no size limit, no timeout | `image-proxy/route.ts` | — | HIGH | Add `AbortSignal.timeout(10000)` + size check |
| CV pipeline: 4 workers, no timeout, no queue | `analyze.py` | 25 | HIGH | Add timeout + async task queue |
| K8s memory limit too low (2Gi) | `backend-deployment.yaml` | 27 | HIGH | Increase to 4Gi |
| Decompression bomb check is post-read | `security.py` | 120 | MEDIUM | Stream-based validation |
| Proxy has no request body size limit | `proxy/[...path]/route.ts` | — | MEDIUM | Check Content-Length |
| GT mask cache: 64MB, no eviction | `color_analysis.py` | 271 | LOW | Add LRU eviction |

### Risk #3: Data Integrity

| Vulnerability | File | Line | Severity | Fix |
|--------------|------|------|----------|-----|
| Stripe webhook idempotency inverted | `stripe.py` | 216-220 | CRITICAL | Use `exists()` instead of `set(nx=True)` return value |
| Scan quota race condition | `analyze.py` | 95-99 | HIGH | Use `SELECT ... FOR UPDATE` |
| No database backups in k8s | k8s manifests | — | HIGH | Add Velero or cron snapshots |
| Postgres sync commit blocks on replica down | `postgres-replica.yaml` | — | MEDIUM | Switch to `synchronous_commit = remote_write` |

---

## 5. Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| SQL Injection | PASS | SQLAlchemy ORM parameterization used throughout |
| XSS | WARN | Error messages returned to client; `dangerouslySetInnerHTML` in ProductCard |
| CSRF | FAIL | No CSRF tokens; only CORS origin check |
| Authentication | GOOD | JWT + bcrypt + refresh rotation; brute-force rate limit on login |
| Authorization | WARN | Most routes protected; open proxy bypasses guards |
| Rate Limiting | WARN | Implemented but not atomic; X-Forwarded-For spoofable |
| Password Storage | PASS | bcrypt with salt; no plain-text |
| Secrets Management | WARN | Env-based; no vault; default DB credentials in config.py |
| HTTPS | UNKNOWN | Assumed via reverse proxy (TLS in Ingress) |
| HSTS | PASS | Header set in SecurityHeadersMiddleware |
| CSP | PARTIAL | Present but `unsafe-inline` and `unsafe-eval` too permissive |
| CORS | WARN | Hardcoded whitelist; includes localhost |
| Input Validation | WARN | Pydantic used; some edge cases (unicode bypasses in LLM sanitizer) |
| Dependency Audit | FAIL | No pip-audit or npm audit in CI |
| File Upload | GOOD | Magic bytes validation; dimension checks |
| Open Redirect | FAIL | middleware.ts callbackUrl not validated |

---

## 6. Tech Debt

| Debt | Location | Cost now | Cost in 3 months |
|------|----------|----------|-------------------|
| CI doesn't run tests | `.github/workflows/ci.yml` | 1 hour | Tests drift from code; every prod bug could've been caught |
| Docker tags are `latest` | K8s manifests | 30 min | Unpredictable deploys; can't rollback; requires full tagging pipeline |
| 567-line dashboard | `dashboard/page.tsx` | 1 day | Untangling state dependencies; new devs can't contribute |
| localStorage as state | ~6 components | 1 day | Rewriting data flow across entire frontend |
| No API versioning | All routes under `/api/` | 1 day | Maintaining two routing layers; breaking B2B SDK clients |
| Mock endpoints in prod | `api/analyze/route.ts`, `api/products/route.ts` | 5 min | Someone hits them, gets fake data, files bug report |
| Inline i18n (68KB file) | `frontend/src/lib/i18n.ts` | 1 day | Every new language means editing massive file |
| No observability | K8s infrastructure | 1-2 days | Debugging production issues blind; can't measure SLAs |
| Fire-and-forget emails | `auth.py:78`, `email.py` | 1 day | Users don't get welcome emails; no way to know or retry |
| Broad except blocks | 3+ backend files | 30 min | Swallows real errors; masks bugs |

---

## 7. Investor Readiness

### Score: 6/10

### What impresses

| Signal | Why it matters |
|--------|---------------|
| CV pipeline with real computer science (BiSeNet + K-Means++ + ITA + Delta-E 2000) | Technical moat; not an API wrapper |
| 379 backend tests across 42 files | Engineering discipline |
| K8s manifests with HPA + Postgres replication + TLS | Production thinking |
| Security spec document (260 lines of threat modeling) | Security awareness |
| B2B SDK exists | Platform thinking |
| Server-side JWT proxy | Security architecture maturity |

### What makes them walk away

| Red Flag | Why it kills the deal |
|----------|----------------------|
| CI doesn't run tests | 379 tests exist but never execute automatically. Test suite is decorative. |
| Stripe webhook bug (double-processing) | Billing system can't be trusted. Chargebacks destroy trust. |
| Open proxy + open redirect (OWASP basics) | Surface-level security review catches these immediately. |
| 4 components over 500 lines | Codebase can't absorb new developers. Bus factor = 1. |
| No database backups | "What's your backup strategy?" "Replication." Doesn't protect against data corruption. |
| Mock endpoints in production code | Looks like the demo was faked. |

---

## 8. Test Coverage Assessment

### Backend (42 files, 379 tests)

| Category | Files | Tests | Coverage | Status |
|----------|-------|-------|----------|--------|
| Auth & Security | test_security.py, test_auth_models.py | ~50 | 85% | Good |
| CV Pipeline | test_cv_pipeline.py, test_color_science.py | ~80 | 85% | Good |
| API Integration | test_api_integration.py | ~40 | 70% | Decent |
| Database Repos | test_user_repo.py, test_product_repo.py | ~30 | 60% | Gaps |
| Rate Limiting | test_rate_limiter.py | ~20 | 70% | Decent |
| Features | shopping_agent, celebrity, wardrobe, wishlist | ~100+ | 50% | Weak |
| Stripe/Payments | test_stripe_webhook.py | ~10 | 25% | Weak |
| **Overall Backend** | | **~379** | **~65%** | |

### Frontend (29 files)

| Category | Files | Coverage | Status |
|----------|-------|----------|--------|
| Component rendering | 17 | 85% | Good (but shallow) |
| User interactions | — | 5% | Almost none |
| State management (Zustand) | 1 | 30% | Basic |
| Hooks | 4 | 50% | Decent |
| Middleware | 1 | 20% | Basic |
| API routes | 0 | 0% | Missing |
| E2E flows | 0 | 0% | Missing |
| Accessibility | 0 | 0% | Missing |
| **Overall Frontend** | | **~30%** | |

### Critical test gaps

- No E2E payment flow (register -> trial -> expire -> subscribe -> cancel)
- No concurrent request tests (race conditions untested)
- No security tests (SQL injection, XSS, path traversal)
- No load/performance tests (3s p95 SLA unverified)
- No accessibility tests
- No migration up/down tests
- Frontend API routes (`/api/proxy/`, `/api/image-proxy/`) completely untested

---

## 9. Infrastructure Readiness

### What exists

| Component | File | Status |
|-----------|------|--------|
| K8s backend deployment | `k8s/backend-deployment.yaml` | 3 replicas, HPA, probes |
| K8s frontend deployment | `k8s/frontend-deployment.yaml` | 2 replicas, Ingress, TLS |
| K8s Postgres | `k8s/postgres-replica.yaml` | Primary + 2 replicas, streaming replication |
| Docker Compose (dev) | `docker-compose.yml` | Postgres + Redis with healthchecks |
| Docker Compose (test) | `docker-compose.test.yml` | Isolated ports (5433, 6380) |
| Backend Dockerfile | `backend/Dockerfile` | python:3.12-slim with OpenCV deps |
| CI Pipeline | `.github/workflows/ci.yml` | Lint + typecheck only |
| Alembic Migrations | `backend/alembic/` | 19 versions |

### What's critically missing

| Missing | Impact | Effort |
|---------|--------|--------|
| Tests in CI | Tests never run automatically | 1 hr |
| Frontend Dockerfile | Can't containerize frontend | 1 hr |
| Database backups | Data loss on corruption | 1 day |
| Postgres failover automation | Manual promotion required during outage | 2-3 days |
| Observability (Prometheus/Grafana) | Can't debug production | 1-2 days |
| Redis in K8s | Rate limiting only works with docker-compose | 2 hr |
| Security scanning in CI | Vulnerable deps not caught | 2 hr |
| Namespace isolation | All resources in default namespace | 30 min |
| RBAC policies | No ServiceAccounts or Roles | 1 hr |
| Image registry + tagging | Using `latest` tag | 2 hr |
| Pod disruption budgets | No graceful shutdown guarantees | 30 min |
| Network policies | No inter-pod traffic restrictions | 1 hr |

### K8s specific fixes needed

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Image tag `latest` | backend-deployment.yaml | image tag | Pin to git SHA |
| Memory limit 2Gi too low for ML | backend-deployment.yaml | 27 | Increase to 4Gi |
| Liveness probe fires before model loads | backend-deployment.yaml | 34 | Increase initialDelaySeconds to 120s |
| HPA only on CPU (ML is memory-bound) | backend-deployment.yaml | 54-60 | Add memory metric |
| No security context | All deployments | — | Add `runAsNonRoot: true` |
| Sync commit blocks on replica failure | postgres-replica.yaml | — | Use `synchronous_commit = remote_write` |
| Dockerfile runs as root | backend/Dockerfile | — | Add `USER` directive |

---

## 10. File-Level Issue Index

Quick lookup: every file with issues and what to fix.

### Backend

| File | Issues | Priority |
|------|--------|----------|
| `app/api/stripe.py:216-220` | Webhook idempotency inverted | P0 |
| `app/api/auth.py:176` | Google OAuth audience optional | P0 |
| `app/api/auth.py:78` | Fire-and-forget email | P2 |
| `app/api/analyze.py:25` | 4 thread workers, no timeout | P2 |
| `app/api/analyze.py:22,150,241` | Magic numbers not in config | P2 |
| `app/api/analyze.py:95-99` | Scan quota race condition | P1 |
| `app/api/analyze.py:194` | Error messages leak details | P2 |
| `app/api/products.py:165-262` | 98-line function | P2 |
| `app/core/rate_limiter.py:19-20` | In-memory dict, no lock | P1 |
| `app/core/rate_limiter.py:86-89` | Redis pipeline not atomic | P1 |
| `app/core/rate_limiter.py:136-140` | Trusts X-Forwarded-For | P2 |
| `app/core/config.py:21` | Hardcoded postgres:postgres default | P2 |
| `app/core/config.py:62-65` | JWT secret only checks length, not entropy | P3 |
| `app/core/security.py:120` | Decompression bomb check is post-read | P2 |
| `app/core/security.py:157-183` | LLM sanitizer has unicode bypass | P3 |
| `app/cv/color_analysis.py:271` | GT mask cache: 64MB, no eviction | P2 |
| `app/models.py:241` | No pgvector index | P1 |
| `app/models.py:126` | No index on AnalysisResult.created_at | P1 |
| `app/models.py:48` | No index on User.stripe_customer_id | P1 |
| `app/repositories/product_repo.py:141-174` | 3 sequential queries (N+1) | P2 |
| `app/services/palette_card.py` | 210+ line functions | P2 |
| `app/services/color_matcher.py:292-308` | O(N) color name lookup | P3 |
| `app/services/email.py:31-48` | Silent failure, no retry | P2 |
| `app/services/scraper.py:73` | Broad except Exception | P3 |
| `app/main.py:121-127` | No CSRF protection | P1 |

### Frontend

| File | Issues | Priority |
|------|--------|----------|
| `src/middleware.ts:13` | Open redirect vulnerability | P0 |
| `src/app/api/proxy/[...path]/route.ts:31` | Open proxy, no allowlist | P0 |
| `src/app/api/analyze/route.ts` | Mock endpoint in production | P0 |
| `src/app/api/products/route.ts` | Mock endpoint in production | P0 |
| `src/app/api/image-proxy/route.ts` | No size limit, no timeout, no rate limit | P1 |
| `src/app/dashboard/page.tsx` | 567 lines, mixed concerns | P2 |
| `src/app/dashboard/page.tsx:145-207` | Zustand/localStorage race condition | P2 |
| `src/app/analyze/page.tsx:49` | URL.createObjectURL memory leak | P2 |
| `src/app/analyze/page.tsx` | 338 lines, should split | P2 |
| `src/app/account/page.tsx:53` | `window.location.href` kills state | P3 |
| `src/app/account/page.tsx` | Hardcoded "92% Style Rating" | P2 |
| `src/components/CameraCapture.tsx` | 556 lines; lighting runs on main thread | P2 |
| `src/components/ResultsView.tsx` | 506 lines; no ARIA tab pattern | P2 |
| `src/components/SignInModal.tsx` | 334 lines; weak password validation | P2 |
| `src/components/ProductCard.tsx:200-206` | dangerouslySetInnerHTML for CSS | P2 |
| `src/components/NotificationBell.tsx` | Duplicate timeAgo(), silent errors | P3 |
| `src/lib/i18n.ts` | 68KB inline translations | P3 |
| `src/lib/auth.ts` | No NEXTAUTH_SECRET validation on startup | P2 |
| `next.config.ts:26` | Wildcard image domain `*.cdninstagram.com` | P2 |

### Infrastructure

| File | Issues | Priority |
|------|--------|----------|
| `.github/workflows/ci.yml` | Doesn't run pytest or vitest | P1 |
| `k8s/backend-deployment.yaml` | `latest` tag, 2Gi limit, 30s probe delay | P1 |
| `k8s/frontend-deployment.yaml` | `latest` tag | P1 |
| `k8s/postgres-replica.yaml` | No backups, no failover automation, sync commit blocks | P2 |
| `backend/Dockerfile` | Runs as root, no multi-stage build | P2 |

---

## Scorecard

| Dimension | Score | Key Blocker |
|-----------|-------|-------------|
| Architecture | 6.5/10 | No async task queue; no query caching; N+1 queries |
| Code Quality | 5.5/10 | 6 components > 300 lines; magic numbers; broad exceptions |
| Missing Features | 5/10 | No password reset; no email verification; no wardrobe management |
| Security | 5/10 | Open redirect + open proxy + CSRF absent + webhook bug |
| Performance | 5/10 | 4 CV workers; no pgvector index; no caching; no timeouts |
| Tech Debt | 5/10 | CI doesn't test; Docker tags unpinned; mock endpoints in prod |
| Test Coverage | 5/10 | Backend 65%; frontend 30%; zero E2E; zero security tests |
| Infrastructure | 5/10 | No backups; no observability; no failover; runs as root |
| Investor Readiness | 6/10 | Strong CV pipeline + test suite, but basic security holes |
| **Overall** | **5.5/10** | **Production-capable with critical fixes required** |

---

*This evaluation should be revisited after addressing all P0 items and at least 50% of P1 items.*
