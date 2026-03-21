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

![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)

<br/>

[![Stars](https://img.shields.io/github/stars/DineshDhanoki/lumiqe?style=for-the-badge&logo=github&color=EF4444&labelColor=0D1117)](https://github.com/DineshDhanoki/lumiqe/stargazers)
&nbsp;
[![Forks](https://img.shields.io/github/forks/DineshDhanoki/lumiqe?style=for-the-badge&logo=github&color=3B82F6&labelColor=0D1117)](https://github.com/DineshDhanoki/lumiqe/fork)
&nbsp;
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge&labelColor=0D1117)](LICENSE)

</div>

<br/>

> **If this project is interesting to you, a star would mean the world.** It helps others discover it and keeps development going.

<br/>

---

<br/>

## The Problem

Most people wear colors that wash them out, age them, or fight their natural complexion. They don't lack style - they lack *data*.

Professional color consultants charge $200-$500 per session to hold fabric swatches against your face and eyeball the result. It's subjective, expensive, and inaccessible.

**Lumiqe replaces the guesswork with computer vision.** Upload a selfie, and in 3 seconds you get the same seasonal classification a professional would give you - plus a complete style system built around your exact skin tone.

<br/>

## What You Get

<table>
<tr>
<td width="50%" valign="top">

### Core Analysis
- **12-Season Classification** - Not just "warm" or "cool". You get one of 12 precise seasons (Light Spring through Bright Winter)
- **Your Exact Skin Hex Code** - The dominant color of your skin, extracted from thousands of pixels
- **Confidence Score** - Know how reliable the result is based on cluster tightness
- **Undertone Detection** - Warm, cool, or neutral - derived from a*b* chromaticity, not guesswork
- **Contrast Level** - Low, medium, or high - determines how bold your colors should be

</td>
<td width="50%" valign="top">

### Your Color System
- **6-Color Core Palette** - The exact hex codes that will make your skin glow
- **Colors to Avoid** - What's actively fighting your complexion
- **Best Metal** - Gold or silver, based on your undertone science
- **Makeup Shades** - Ideal lip, blush, and eyeshadow hex codes
- **Celebrity Matches** - Famous people who share your season

</td>
</tr>
<tr>
<td valign="top">

### Professional Depth
- **Style Archetype** - Your fashion personality mapped to your colors
- **7-Occasion Guide** - Work, formal, casual, date night, beach, wedding, athletic
- **10-Piece Capsule Wardrobe** - Complete wardrobe formula with exact colors
- **Hair & Beauty Guide** - Best hair colors, highlights, and beauty products
- **Pattern & Texture Guide** - Which prints and fabrics complement your season

</td>
<td valign="top">

### AI-Powered Tools
- **AI Stylist Chat** - Ask anything about your colors, get personalized advice (Llama 3.3 70B)
- **Buy or Pass Scanner** - Photograph any clothing item in-store, get an instant palette match score using Delta-E CIE2000
- **Curated Shopping Feed** - Products filtered to your exact palette
- **Downloadable Palette Card** - Take your colors shopping with you

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
+---------------------------------------------+
|            FRONTEND  (Next.js 15)            |
|                                              |
|  Landing  |  Analyze  |  Results (6 tabs)    |
|  Dashboard  |  Feed  |  Scanner  |  Pricing  |
|                                              |
|  NextAuth.js  (Google OAuth + Credentials)   |
+---------------------+------------------------+
                      |
                      |  REST API (JSON)
                      v
+---------------------------------------------+
|            BACKEND  (FastAPI)                |
|                                              |
|  /api/analyze -----> CV Pipeline (4 threads) |
|  /api/color-chat --> Groq LLM               |
|  /api/scan-item ---> Delta-E Matching        |
|  /api/auth/* ------> JWT (bcrypt + HS256)    |
|  /api/stripe/* ----> Subscription Billing    |
|                                              |
+------+----------+----------+---------+------+
       |          |          |         |
       v          v          v         v
   +--------+ +--------+ +------+ +-------+
   |OpenCV  | |Postgres| |Redis | |Groq   |
   |PyTorch | |pgvector| |Rate  | |Llama  |
   |BiSeNet | |Users   | |Limit | |3.3 70B|
   |MediaPipe |Analyses|        |        |
   +--------+ +--------+ +------+ +-------+
```

<br/>

## Quick Start

### Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Python | 3.12+ | Backend + CV pipeline |
| Node.js | 18+ | Frontend |
| Docker | Optional | PostgreSQL + Redis (or install locally) |

### 1. Clone and set up infrastructure

```bash
git clone https://github.com/DineshDhanoki/lumiqe.git
cd lumiqe

# Start PostgreSQL + Redis (optional — app works without them)
docker compose up -d
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env: set JWT_SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(64))")

# Start
uvicorn app.main:app --reload --port 8000
```

The server will auto-download model weights (~100MB) on first startup.

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local:
#   NEXTAUTH_SECRET=<any random string>
#   NEXTAUTH_URL=http://localhost:3000
#   NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

### 4. Open [localhost:3000](http://localhost:3000)

> **No database?** No problem. The app works fully without PostgreSQL — auth endpoints gracefully return 503, while the entire analysis + results experience works perfectly.

<br/>

## API Reference

<details open>
<summary><strong>Core Endpoints</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | No | Health check + model status |
| `/api/analyze` | POST | Optional | Selfie &rarr; full 12-season analysis |
| `/api/complete-profile` | GET | No | Full professional season profile |
| `/api/scan-item` | POST | Required | Clothing photo &rarr; Buy/Pass verdict |
| `/api/color-chat` | POST | Required | AI stylist conversation |
| `/api/palette-card` | POST | No | Generate downloadable palette PNG |

</details>

<details>
<summary><strong>Auth & Account</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | POST | No | Create account (email + password) |
| `/api/auth/login` | POST | No | Authenticate &rarr; JWT tokens |
| `/api/auth/google` | POST | No | Google OAuth auto-register/login |
| `/api/auth/refresh` | POST | No | Exchange refresh token for new access token |
| `/api/auth/me` | GET | Required | Current user profile |
| `/api/auth/me` | DELETE | Required | GDPR: delete account + all data |

</details>

<details>
<summary><strong>Shopping & Styling</strong></summary>

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/styling-tips` | GET | Optional | AI-generated fashion advice |
| `/api/shopping-agent` | GET | Required | Curated outfit assembly (8 categories) |
| `/api/products` | GET | No | Browse product catalog |
| `/api/outfit` | GET | Required | Get curated outfit for palette |

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
| **Frontend** | Next.js 15, React 19, TypeScript | App Router, SSR, client components |
| **Styling** | Tailwind CSS 4, Framer Motion | Responsive design, fluid animations |
| **Auth** | NextAuth.js v5 | Google OAuth + email/password, JWT sessions |
| **Backend** | Python 3.12, FastAPI, Pydantic v2 | Async API, OpenAPI docs, validation |
| **CV Pipeline** | OpenCV, MediaPipe, PyTorch | Face detection, skin segmentation, color extraction |
| **Color Science** | K-Means++, CIE L\*a\*b\*, Delta-E 2000 | Perceptually accurate color matching |
| **AI / LLM** | Groq (Llama 3.3 70B) | Styling tips, conversational stylist |
| **Database** | PostgreSQL 16 + pgvector | Users, analyses, vector similarity search |
| **Caching** | Redis 7 | Rate limiting (sliding window) |
| **Payments** | Stripe | Subscriptions + one-time credit purchases |
| **Email** | Resend | Transactional emails (welcome, results, upgrade) |
| **Monitoring** | Sentry | Error tracking + performance traces |
| **CI** | GitHub Actions | Lint + typecheck (frontend), ruff (backend) |

<br/>

## Project Structure

```
lumiqe/
  backend/
    app/
      api/            # FastAPI route handlers (17 endpoint modules)
      core/           # Config, security, dependencies, rate limiter
      cv/             # Computer vision pipeline
        pipeline.py   #   9-step orchestrator
        face_detector.py  # MediaPipe face detection + EXIF rotation
        skin_parser.py    # BiSeNet skin segmentation
        color_analysis.py # K-Means, ITA, season mapping
        loader.py         # Model loading (lazy, thread-safe)
      middleware/      # Security headers
      models.py        # SQLAlchemy ORM (User, AnalysisResult, Product, Event)
      repositories/    # Pure database queries
      schemas/         # Pydantic request/response models
      services/        # Business logic (color matcher, email, shopping agent)
    data/              # seasons.json knowledge base, product catalog
    tests/             # pytest + hypothesis property-based tests
    face-parsing/      # BiSeNet model architecture (resnet.py, model.py)
  frontend/
    src/
      app/            # Next.js App Router pages
      components/     # 35+ React components
      lib/            # API client, auth config, i18n, utilities
    tests/            # Vitest component tests
```

<br/>

## The Color Science

This isn't a color quiz. It's computational colorimetry.

| Concept | What It Does | Why It Matters |
|---------|-------------|----------------|
| **BiSeNet Segmentation** | Neural network trained on face parsing. Extracts only skin pixels (class 1), discarding hair, eyes, lips, and background. | Prevents non-skin colors from contaminating the analysis. |
| **Grey World Correction** | Normalizes color cast assuming the scene average should be neutral gray. Multipliers clamped to [0.85, 1.15]. | A photo taken under warm tungsten light doesn't get classified differently than one taken in daylight. |
| **CLAHE** | Contrast Limited Adaptive Histogram Equalization on the L\* channel. | Removes harsh shadows and specular highlights without altering chromaticity. |
| **K-Means++ on a\*b\*** | Clusters skin pixels in the a\*b\* chromaticity plane only. L\* (lightness) is excluded from clustering. | Makes undertone detection independent of lighting conditions. The same skin color produces the same a\*b\* cluster under different illuminants. |
| **ITA Angle** | Individual Typology Angle: `atan2(L* - 50, b*)`. Higher = lighter skin. | Clinically validated metric for skin lightness classification. Used in dermatology research. |
| **Delta-E CIE2000** | Perceptual color distance metric. Accounts for human vision's non-uniform sensitivity across the color space. | When matching clothing to palette, Delta-E < 5 means "visually identical," not "numerically close in RGB." |

<br/>

## Roadmap

- [x] 9-step CV pipeline (face detection &rarr; 12-season classification)
- [x] Full-stack web app with 6-tab results experience
- [x] AI Stylist chat (Groq / Llama 3.3 70B)
- [x] Buy or Pass in-store scanner with Delta-E matching
- [x] Live camera capture with face alignment
- [x] Stripe subscription + credit system
- [x] Social sharing with OG image generation
- [x] Referral system
- [x] Email notifications (Resend)
- [ ] Mobile app (React Native)
- [ ] Virtual try-on (drape palette colors on photo)
- [ ] Wardrobe tracker (save owned items, get outfit suggestions)
- [ ] Multi-language support (EN/ES/FR/AR in progress)
- [ ] Body shape analysis integration

<br/>

## Contributing

Contributions are welcome. See [TASKS.md](TASKS.md) for a prioritized list of open tasks with time estimates.

```bash
# Fork, clone, then:
cd frontend && npm run typecheck && npm run lint   # must pass
cd backend  && ruff check app/                     # must pass
```

Read [CLAUDE.md](CLAUDE.md) for engineering principles. Use conventional commits (`feat:`, `fix:`, `refactor:`). Open a PR against `main`.

<br/>

## License

MIT License. See [LICENSE](LICENSE) for details.

<br/>

---

<div align="center">

<br/>

**Built by [Dinesh Dhanoki](https://github.com/DineshDhanoki)**

If Lumiqe helped you discover your colors, a star helps others find it too.

<br/>

[<img src="https://img.shields.io/badge/Star_on_GitHub-EF4444?style=for-the-badge&logo=github&logoColor=white" alt="Star" />](https://github.com/DineshDhanoki/lumiqe/stargazers)
&nbsp;&nbsp;
[<img src="https://img.shields.io/badge/Fork_&_Contribute-0D1117?style=for-the-badge&logo=github&logoColor=white" alt="Fork" />](https://github.com/DineshDhanoki/lumiqe/fork)

<br/>

</div>
