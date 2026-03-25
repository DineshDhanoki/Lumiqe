<div align="center">

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/LUMIQE-000000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkw2IDdMMTIgMTJMMTggN0wxMiAyWiIgZmlsbD0iI0VGNDQ0NCIvPjxwYXRoIGQ9Ik02IDdMMTIgMTJMMTggN00xMiAxMkw2IDE3TDEyIDIyTDE4IDE3TDEyIDEyWiIgZmlsbD0iI0VGNDQ0NCIgZmlsbC1vcGFjaXR5PSIwLjUiLz48L3N2Zz4=&logoColor=white&labelColor=000000" />
  <img alt="Lumiqe" src="https://img.shields.io/badge/LUMIQE-000000?style=for-the-badge&logoColor=white&labelColor=000000" />
</picture>

<br/>

# AI-Powered Color Analysis Engine

### Upload a selfie. Get the exact colors that make you look extraordinary.

**Professional seasonal color analysis costs $200-$500.**<br/>
**Lumiqe does it in 3 seconds, powered by computer vision.**

<br/>

[<img src="https://img.shields.io/badge/Try_Live_Demo-EF4444?style=for-the-badge&logoColor=white" alt="Live Demo" />](https://lumiqe.in)
&nbsp;&nbsp;
[<img src="https://img.shields.io/badge/Watch_Demo_Video-000000?style=for-the-badge&logo=youtube&logoColor=white" alt="Demo Video" />](#-how-it-works)

<br/>

![Python](https://img.shields.io/badge/Python_3.14-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)

<br/>

[![Stars](https://img.shields.io/github/stars/DineshDhanoki/lumiqe?style=for-the-badge&logo=github&color=EF4444&labelColor=0D1117)](https://github.com/DineshDhanoki/lumiqe/stargazers)
&nbsp;
[![Forks](https://img.shields.io/github/forks/DineshDhanoki/lumiqe?style=for-the-badge&logo=github&color=3B82F6&labelColor=0D1117)](https://github.com/DineshDhanoki/lumiqe/fork)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge&labelColor=0D1117)](LICENSE)

</div>

<br/>

---

<br/>

## The Problem

Most people wear colors that wash them out, age them, or fight their natural complexion. They don't lack style — they lack *data*.

Professional color consultants charge $200-$500 per session to hold fabric swatches against your face and eyeball the result. It's subjective, expensive, and inaccessible.

**Lumiqe replaces the guesswork with computer vision.** Upload a selfie, and in 3 seconds you get the same seasonal classification a professional would give you — plus a complete style system built around your exact skin tone.

<br/>

## What You Get

<table>
<tr>
<td width="50%" valign="top">

### Core Analysis
- **12-Season Classification** — Not just "warm" or "cool". You get one of 12 precise seasons (Light Spring through Bright Winter)
- **Your Exact Skin Hex Code** — The dominant color of your skin, extracted from thousands of pixels
- **Confidence Score** — How reliable the result is, based on cluster tightness
- **Undertone Detection** — Warm, cool, or neutral, derived from a*b* chromaticity
- **Contrast Level** — Low, medium, or high, determines how bold your colors should be

</td>
<td width="50%" valign="top">

### Your Color System
- **6-Color Core Palette** — The exact hex codes that make your skin glow
- **Colors to Avoid** — What's actively fighting your complexion
- **Best Metal** — Gold or silver, based on undertone science
- **Makeup Shades** — Ideal lip, blush, and eyeshadow hex codes
- **Celebrity Matches** — Famous people who share your season

</td>
</tr>
<tr>
<td valign="top">

### Professional Depth
- **Style Archetype** — Your fashion personality mapped to your colors
- **7-Occasion Guide** — Work, formal, casual, date night, beach, wedding, athletic
- **10-Piece Capsule Wardrobe** — Complete wardrobe formula with exact colors
- **Hair & Beauty Guide** — Best hair colors, highlights, and beauty products
- **Pattern & Texture Guide** — Which prints and fabrics complement your season

</td>
<td valign="top">

### AI-Powered Tools
- **AI Stylist Chat** — Ask anything about your colors, get personalized advice (Llama 3.3 70B via Groq)
- **Buy or Pass Scanner** — Photograph any clothing item in-store, get an instant palette match score using Delta-E CIE2000
- **8-Piece Outfit Builder** — Complete curated outfits matched to your palette via color-distance scoring
- **Curated Shopping Feed** — Products filtered to your exact palette
- **Downloadable Palette Card** — Take your colors shopping with you

</td>
</tr>
</table>

<br/>

## How It Works

The analysis pipeline runs 9 steps in under 3 seconds:

```
                            Your Selfie
                                 |
                    +------------+------------+
                    |                         |
               1. DETECT                 2. VALIDATE
          MediaPipe BlazeFace          Exposure quality gate
          isolates face region        (rejects too dark/bright)
                    |                         |
                    +------------+------------+
                                 |
                            3. SEGMENT
                     BiSeNet neural network
                  masks skin pixels only (class 1)
                  ignores hair, eyes, lips, background
                                 |
                    +------------+------------+
                    |                         |
              4. CORRECT                 5. EXTRACT
         Grey World color           CLAHE on L*a*b* L-channel
         constancy (clamped)        removes lighting artifacts
                    |                         |
                    +------------+------------+
                                 |
                           6. CLUSTER
                    K-Means++ on a*b* channels
                   (lighting-invariant undertone)
                   Glare & shadow pixels filtered
                                 |
                    +------------+------------+
                    |                         |
              7. MEASURE                 8. CLASSIFY
          ITA Angle from CIE         ITA + warmth score
          L*a*b* coordinates         maps to 1 of 12 seasons
                    |                         |
                    +------------+------------+
                                 |
                          9. ENRICH
                 seasons.json knowledge base adds
            palette, occasions, wardrobe, beauty guide
                                 |
                                 v
                    Your Complete Color Blueprint
```

**Key innovation:** The pipeline clusters on **a\*b\* channels only** (not L\*), making the undertone detection lighting-invariant. A photo taken in warm tungsten light and one taken in cool daylight produce the same season classification for the same person.

<br/>

## Architecture

```
Browser / Mobile
      |
      |  HTTPS
      v
+--------------------------------------------------+
|              FRONTEND  (Next.js 16)               |
|                                                   |
|  Landing | Analyze | Results | Dashboard | Feed   |
|  Shopping Agent | Scanner | Pricing | Account     |
|                                                   |
|  NextAuth.js  (Google OAuth + Credentials)        |
|  Server-side JWT proxy (/api/proxy/[...path])     |
+------------------------+-------------------------+
                         |
                         |  REST API (JSON)
                         v
+--------------------------------------------------+
|              BACKEND  (FastAPI 0.128)              |
|                                                   |
|  /api/analyze -------> CV Pipeline (thread pool)  |
|  /api/shopping-agent -> DB + Delta-E matching     |
|  /api/color-chat -----> Groq LLM                  |
|  /api/scan-item ------> Delta-E color scoring     |
|  /api/auth/* ---------> JWT (bcrypt + HS256)      |
|  /api/stripe/* -------> Subscription billing      |
|                                                   |
+------+----------+----------+---------+-----------+
       |          |          |         |
       v          v          v         v
   +--------+ +--------+ +------+ +---------+
   |OpenCV  | |Postgres| |Redis | |Groq     |
   |PyTorch | |pgvector| |Rate  | |Llama    |
   |BiSeNet | |Users   | |Limit | |3.3 70B  |
   |MediaPipe |Products|        |          |
   +--------+ +--------+ +------+ +---------+
```

**Security model:** JWTs never reach the browser. The frontend stores the backend token in an httpOnly cookie and proxies all API requests through a server-side route (`/api/proxy/[...path]`), so client JavaScript never has access to authentication tokens.

<br/>

## Quick Start

### Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Python | 3.12+ | Backend + CV pipeline |
| Node.js | 20+ | Frontend |
| PostgreSQL | 15+ with [pgvector](https://github.com/pgvector/pgvector) | Users, analyses, product catalog |
| Redis | 7+ (optional) | Production rate limiting |

### 1. Clone and configure

```bash
git clone https://github.com/DineshDhanoki/lumiqe.git
cd lumiqe

# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
```

Generate required secrets:

```bash
# JWT secret (backend — required, min 32 chars)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# NextAuth secret (frontend)
openssl rand -base64 32
```

### 2. Database

```bash
createdb lumiqe_dev
psql lumiqe_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 3. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start (auto-downloads BiSeNet weights ~100MB on first run)
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install

# Create frontend env
cat > .env.local << 'EOF'
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

npm run dev
```

Open [localhost:3000](http://localhost:3000).

> **No database?** The app degrades gracefully — auth endpoints return 503, but the entire analysis + results experience works without PostgreSQL.

<br/>

## API Reference

<details open>
<summary><strong>Core Endpoints</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | No | Health check + model status |
| `/api/analyze` | POST | Optional | Selfie upload → full 12-season analysis |
| `/api/complete-profile` | GET | No | Full professional season profile |
| `/api/scan-item` | POST | Required | Clothing photo → Buy/Pass verdict |
| `/api/color-chat` | POST | Required | AI stylist conversation |
| `/api/palette-card` | POST | No | Generate downloadable palette PNG |

</details>

<details>
<summary><strong>Auth & Account</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | No | Create account (email + password) |
| `/api/auth/login` | POST | No | Authenticate → JWT tokens |
| `/api/auth/google` | POST | No | Google OAuth auto-register/login |
| `/api/auth/refresh` | POST | No | Exchange refresh token for new access token |
| `/api/auth/me` | GET | Required | Current user profile |
| `/api/auth/me` | DELETE | Required | GDPR: permanently delete account + all data |

</details>

<details>
<summary><strong>Shopping & Styling</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/styling-tips` | GET | Optional | AI-generated fashion advice for your season |
| `/api/shopping-agent` | GET | Required | Curated 8-piece outfit (DB-first, optional Firecrawl) |
| `/api/products` | GET | No | Browse product catalog with filters |
| `/api/outfit/daily` | GET | Required | Daily outfit recommendation |

</details>

<details>
<summary><strong>Payments & Social</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/stripe/checkout` | POST | Required | Create Stripe checkout session |
| `/api/stripe/portal` | POST | Required | Open Stripe customer portal |
| `/api/stripe/webhook` | POST | No | Stripe webhook handler |
| `/api/referral/code` | GET | Required | Get/generate referral code |
| `/api/share/token` | POST | Required | Generate shareable results link |

</details>

<details>
<summary><strong>Example: POST /api/analyze response</strong></summary>

```json
{
  "season": "Deep Autumn",
  "description": "You have warm, deep coloring. Rich, saturated warm tones like burgundy and forest green shine.",
  "hex_color": "#B07848",
  "undertone": "warm",
  "confidence": 0.91,
  "contrast_level": "High",
  "ita_angle": 18.4,
  "palette": ["#8B5E3C", "#6B3E1C", "#A87848", "#5C2E10", "#7A4E30", "#B88858"],
  "avoid_colors": ["#FF69B4", "#87CEEB", "#E6E6FA"],
  "metal": "Gold",
  "makeup": {
    "lips": "#C44536",
    "blush": "#E07A5F",
    "eyeshadow": "#81B29A"
  },
  "celebrities": [
    { "name": "Julia Roberts", "season": "Deep Autumn" }
  ],
  "skin_pixels": 48291,
  "processing_time_ms": 1847.3
}
```

</details>

<br/>

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 | App Router, Turbopack, server-side API proxy |
| **Styling** | Tailwind CSS 4, Framer Motion 12 | Responsive design, fluid animations |
| **Auth** | NextAuth.js v4 | Google OAuth + credentials, httpOnly JWT cookies |
| **Backend** | Python 3.14, FastAPI 0.128, Pydantic v2 | Async API, OpenAPI docs, input validation |
| **CV Pipeline** | OpenCV 4.12, MediaPipe 0.10, PyTorch 2.10 | Face detection, skin segmentation, color extraction |
| **Color Science** | K-Means++, CIE L\*a\*b\*, Delta-E 2000, ITA | Perceptually accurate color matching |
| **AI / LLM** | Groq (Llama 3.3 70B) | Styling tips, conversational stylist |
| **Database** | PostgreSQL + pgvector | Users, analyses, vector similarity search |
| **Rate Limiting** | Redis 7 (sliding window) | Per-email brute-force protection, per-endpoint throttling |
| **Payments** | Stripe | Subscriptions (monthly/annual) + webhook lifecycle |
| **Email** | Resend | Welcome emails, transactional notifications |
| **Monitoring** | Sentry | Error tracking + performance traces |

<br/>

## Project Structure

```
lumiqe/
  backend/
    app/
      api/                  # 19 FastAPI route modules
        auth.py             #   Register, login, Google OAuth, refresh, GDPR delete
        analyze.py          #   Image upload → CV pipeline
        shopping_agent.py   #   8-piece outfit generation
        stripe.py           #   Checkout, portal, webhooks
        color_chat.py       #   AI stylist conversation
        scan.py             #   Item scanner (Buy/Pass)
        products.py         #   Product catalog feed
        ...
      cv/                   # Computer vision pipeline
        pipeline.py         #   9-step orchestrator
        face_detector.py    #   MediaPipe face detection + EXIF rotation
        skin_parser.py      #   BiSeNet skin segmentation
        color_analysis.py   #   Grey World, CLAHE, K-Means++, ITA, season mapping
        loader.py           #   Lazy thread-safe model loading
      core/                 # Infrastructure
        config.py           #   Pydantic BaseSettings (all env vars)
        security.py         #   JWT, bcrypt, file validation, prompt injection defense
        dependencies.py     #   DB sessions, auth guards, role checks
        rate_limiter.py     #   Redis sliding window + in-memory fallback
      models.py             # SQLAlchemy ORM (User, AnalysisResult, Product, Event)
      repositories/         # Data access layer (user, product, analysis repos)
      schemas/              # Pydantic request/response models
      services/             # Business logic
        shopping_agent.py   #   DB-first product matching, optional Firecrawl
        color_matcher.py    #   CIE Delta-E 2000 implementation
        palette_card.py     #   Downloadable palette image generation
        scraper.py          #   Product scraping + color extraction
        email.py            #   Resend email service
        affiliate.py        #   Amazon/CueLinks/Admitad link decoration
    data/                   # seasons.json knowledge base
    tests/                  # pytest tests
  frontend/
    src/
      app/                  # Next.js App Router pages
        page.tsx            #   Landing page
        analyze/            #   Photo upload + analysis
        results/            #   Color profile (6 tabs)
        dashboard/          #   User dashboard with sync
        shopping-agent/     #   8-piece outfit builder
        scan/               #   Camera item scanner
        feed/               #   Product discovery feed
        account/            #   Profile + subscription
        seasons/[season]/   #   Season detail pages
        api/                #   Server-side route handlers
          proxy/[...path]/  #     JWT proxy to backend
          auth/[...nextauth]/ #   NextAuth handlers
          image-proxy/      #     CDN image proxy
      components/           # 59 React components
      lib/                  # Utilities
        api.ts              #   apiFetch() — all requests through proxy
        auth.ts             #   NextAuth config (Google + Credentials)
        i18n.ts             #   Internationalization (EN/ES + extensible)
        analytics.ts        #   PostHog analytics
```

<br/>

## The Color Science

This isn't a color quiz. It's computational colorimetry.

| Concept | What It Does | Why It Matters |
|---------|-------------|----------------|
| **BiSeNet Segmentation** | Neural network trained on face parsing. Extracts only skin pixels (class 1), discarding hair, eyes, lips, and background. | Prevents non-skin colors from contaminating the analysis. |
| **Grey World Correction** | Normalizes color cast assuming the scene average should be neutral gray. Multipliers clamped to [0.85, 1.15]. | A photo taken under warm tungsten light doesn't get classified differently than one taken in daylight. |
| **CLAHE** | Contrast Limited Adaptive Histogram Equalization on the L\* channel. | Removes harsh shadows and specular highlights without altering chromaticity. |
| **K-Means++ on a\*b\*** | Clusters skin pixels in the a\*b\* chromaticity plane only. L\* (lightness) is excluded from clustering. | Makes undertone detection independent of lighting conditions. The same skin produces the same a\*b\* cluster under different illuminants. |
| **ITA Angle** | Individual Typology Angle: `atan2(L* - 50, b*)`. Higher = lighter skin. | Clinically validated metric for skin lightness classification. Used in dermatology research. |
| **Delta-E CIE2000** | Perceptual color distance metric. Accounts for human vision's non-uniform sensitivity across the color space. | When matching clothing to palette, Delta-E < 5 means "visually identical," not "numerically close in RGB." |

<br/>

## Development

```bash
# Backend linting
cd backend && ruff check app/

# Frontend linting + type checking
cd frontend
npm run lint
npm run typecheck

# Backend tests
cd backend && python -m pytest tests/ -v

# Frontend tests
cd frontend && npx vitest run
```

<br/>

## Roadmap

- [x] 9-step CV pipeline (face detection through 12-season classification)
- [x] Full-stack web app with 6-tab results experience
- [x] AI Stylist chat (Groq / Llama 3.3 70B)
- [x] Buy or Pass in-store scanner with Delta-E matching
- [x] 8-piece outfit builder (DB-first + optional Firecrawl)
- [x] Live camera capture with lighting analysis
- [x] Stripe subscription + premium tier
- [x] Social sharing with OG image generation
- [x] Referral system
- [x] Email notifications (Resend)
- [x] Server-side JWT proxy (tokens never exposed to client)
- [x] Redis rate limiting with in-memory fallback
- [x] i18n support (EN/ES, extensible)
- [ ] Mobile app (React Native)
- [ ] Virtual try-on (drape palette colors on photo)
- [ ] Wardrobe tracker (save owned items, get outfit suggestions)
- [ ] Multi-photo analysis (average across 3-5 selfies)
- [ ] Price drop alerts on recommended items

<br/>

## Contributing

Contributions are welcome. Read [CLAUDE.md](CLAUDE.md) for engineering principles.

```bash
# Fork, clone, then verify:
cd frontend && npm run typecheck && npm run lint   # must pass with 0 errors
cd backend  && ruff check app/                     # must pass with 0 errors
```

Use conventional commits (`feat:`, `fix:`, `refactor:`, `test:`). Open a PR against `main`.

<br/>

## License

MIT License. See [LICENSE](LICENSE) for details.

<br/>

---

<div align="center">

<br/>

**Built by [Dinesh Dhanoki](https://github.com/DineshDhanoki)**

<br/>

[<img src="https://img.shields.io/badge/Star_on_GitHub-EF4444?style=for-the-badge&logo=github&logoColor=white" alt="Star" />](https://github.com/DineshDhanoki/lumiqe/stargazers)
&nbsp;&nbsp;
[<img src="https://img.shields.io/badge/Fork_&_Contribute-0D1117?style=for-the-badge&logo=github&logoColor=white" alt="Fork" />](https://github.com/DineshDhanoki/lumiqe/fork)

<br/>

</div>
