# Lumiqe — Open Tasks for Contributors

> This file tracks all pending work. Pick a task, branch off `main`, and submit a PR.
> Time estimates are realistic for someone familiar with Next.js + FastAPI.

---

## How to Get Started

```bash
# 1. Clone the repo
git clone https://github.com/DineshDhanoki/lumiqe.git
cd lumiqe

# 2. Frontend
cd frontend
npm install
npm run dev        # http://localhost:3000

# 3. Backend (separate terminal)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000

# 4. Copy env files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

---

## Quick Wins (< 1 hour each)

These are safe starting points — isolated changes, low risk of breaking anything.

---

### TASK-01 · Fix remaining ESLint warnings
**Effort:** ~45 min
**Files:** multiple frontend files
**Skill:** TypeScript / React

The frontend currently has **48 ESLint warnings** that aren't blocking CI but should be cleaned up.

Run to see them all:
```bash
cd frontend && npm run lint
```

Categories to fix:
- `@typescript-eslint/no-explicit-any` — replace `any` with proper types (~20 warnings)
- `react-hooks/exhaustive-deps` — add missing deps to `useEffect` arrays (~10 warnings)
- `@next/next/no-img-element` — replace `<img>` with Next.js `<Image>` (~5 warnings)
- `react-hooks/set-state-in-effect` and `react-hooks/purity` — minor hook violations (~8 warnings)
- Remaining `no-unused-vars` (~5 warnings)

**Definition of done:** `npm run lint` produces zero warnings.

---

### TASK-02 · Extend i18n to results page and dashboard
**Effort:** ~1 hour
**Files:** `frontend/src/lib/i18n.ts`, `frontend/src/app/results/`, `frontend/src/app/dashboard/`
**Skill:** TypeScript / React

The language switcher (EN/ES/FR/AR) already works on the analyze page but all text on the results page and dashboard is hardcoded English.

Steps:
1. Open `frontend/src/lib/i18n.ts` — add translation keys for results and dashboard strings
2. Import `t()` in `ResultsView.tsx` and `dashboard/page.tsx`
3. Replace hardcoded strings with `t(lang, 'keyName')`

**Note:** The `lang` state + `localStorage` pattern is already in place in `analyze/page.tsx` — copy the same approach.

**Definition of done:** Switching language on any page updates all visible text on the results and dashboard pages too.

---

## Medium Tasks (1–3 hours each)

These require reading existing code carefully before touching anything.

---

### TASK-03 · Fix JWT security — move tokens to httpOnly cookies
**Effort:** ~2 hours
**Files:** `frontend/src/app/api/auth/[...nextauth]/route.ts`, `frontend/src/lib/api.ts`, backend auth middleware
**Skill:** Next.js Auth / Security

**The problem:** The backend JWT (`backendToken`) is currently stored in the NextAuth session object, which is accessible from JavaScript. This is an XSS risk — any injected script can read it.

**The fix:**
1. In the NextAuth callbacks, set the backend token as an `httpOnly` cookie (not in the session object)
2. Update `apiFetch` in `frontend/src/lib/api.ts` to rely on the cookie being sent automatically (add `credentials: 'include'`) instead of reading `session.backendToken`
3. Update backend CORS settings to allow credentials from the frontend origin

**Definition of done:** `session.backendToken` is no longer exposed to client-side JS. Network tab shows the token in a cookie with `HttpOnly` flag.

---

### TASK-04 · Add Redis rate limiting to the analyze endpoint
**Effort:** ~2 hours
**Files:** `backend/app/api/analyze.py`, `backend/app/core/dependencies.py`, `docker-compose.yml`
**Skill:** FastAPI / Redis

**The problem:** The `/api/analyze` endpoint calls the AI model on every request with no limit. A single user (or bot) can spam it and rack up costs.

**The fix:**
1. Add Redis to `docker-compose.yml` (one line service)
2. Install `redis` and `fastapi-limiter` in `backend/requirements.txt`
3. Add a rate-limit dependency to the analyze route:
   - Anonymous: 3 requests / hour per IP
   - Logged-in free tier: 10 requests / day per user
   - Logged-in paid: unlimited
4. Return a clear `429 Too Many Requests` JSON error when limit is hit

**Definition of done:** Hitting the endpoint more than the allowed times returns `{ "error": "Rate limit exceeded", "retry_after": 3600 }`.

---

### TASK-05 · Connect dashboard to backend for cross-device sync
**Effort:** ~2.5 hours
**Files:** `frontend/src/app/dashboard/page.tsx`, `backend/app/api/` (may need new endpoint)
**Skill:** Next.js / FastAPI

**The problem:** The dashboard currently reads analysis history from `localStorage`, which means it only works on the device where the analysis was done. Logging in on a new device shows an empty dashboard.

**The fix:**
1. Check if backend already has a `GET /api/analyses` endpoint (list all analyses for the logged-in user) — if not, add it
2. In `dashboard/page.tsx`, when `session` exists, fetch from the API instead of reading localStorage
3. When no session (anonymous), keep the current localStorage fallback
4. Show a proper empty state with a "Scan your first photo" CTA if the API returns an empty list

**Definition of done:** A logged-in user sees the same history on any device/browser.

---

## Big Tasks (3+ hours)

Tackle these only after the quick wins are done. Coordinate with the repo owner before starting.

---

### TASK-06 · Wardrobe tracking feature
**Effort:** ~4 hours
**Files:** New page `frontend/src/app/wardrobe/`, new backend endpoints, new DB table
**Skill:** Full-stack (Next.js + FastAPI + PostgreSQL)

**Feature overview:** Let users save clothing items they own and tag them with the color from their palette. Show them which outfits work together based on their season.

**Steps:**
1. Add a `wardrobe_items` table to the backend (item name, color hex, category, user_id)
2. Create REST endpoints: `POST /api/wardrobe`, `GET /api/wardrobe`, `DELETE /api/wardrobe/{id}`
3. Build a new page at `/wardrobe` with:
   - Add item form (name, color picker, category dropdown)
   - Grid view of saved items
   - Highlight items that match the user's palette in green, clashing colors in red
4. Add "Wardrobe" link to the dashboard nav

**Definition of done:** A logged-in user can add, view, and delete wardrobe items. Items are color-coded by compatibility with their season.

---

## Completed ✅ (for reference)

| Task | Completed |
|------|-----------|
| GitHub Actions CI pipeline (frontend + backend) | ✅ |
| Easy ESLint warnings (unused imports, unescaped entities) | ✅ |
| Image quality guidance on analyze page | ✅ |
| Merge duplicate `/results` and `/results/[id]` pages into shared `ResultsView` | ✅ |

---

## Contribution Rules

Follow the conventions in `CLAUDE.md`. Key points:

- Branch naming: `feat/task-name` or `fix/task-name`
- Commit style: `feat: add redis rate limiting` (conventional commits)
- Every PR needs: what you changed, how you tested it
- No committing `.env` files or secrets
- Run `npm run typecheck && npm run lint` before pushing frontend changes
- Run `ruff check app/` before pushing backend changes
