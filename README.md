#  Lumiqe AI — Your Personal Color Intelligence

> **AI-powered skin tone analysis and color matching.** Discover your seasonal color palette, find clothes that complement your skin, and never wear the wrong color again.

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

##  What Is Lumiqe?

Lumiqe is a full-stack AI application that analyzes your skin tone to determine your **12-season color type** (e.g., Deep Winter, True Autumn) and provides personalized recommendations for:

-  **Your best colors** — a hex palette tailored to your undertone
-  **Colors to avoid** — shades that wash you out
-  **Metal recommendations** — Gold, Silver, or Both
-  **Celebrity matches** — famous people who share your season
-  **Makeup palette** — ideal lips, blush, and eyeshadow tones
-  **Shopping feed** — curated products that match your palette
-  **Buy or Pass Scanner** — snap a photo of any clothing item in-store and get an instant match score against your personal palette

---

##  Architecture

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                       │
│           Next.js 15 (App Router)               │
│  Landing • Analyze • Results • Feed • Scanner   │
│          NextAuth.js (Google + Email)           │
└──────────────┬──────────────────────┬───────────|
               │  REST API           │
               ▼                     ▼
┌──────────────────────┐  ┌────────────────────────┐
│   FastAPI Backend     │ │   Color Matcher Svc    │
│  /api/analyze         │ │  K-Means + Delta-E     │
│  /api/scan-item       │ │  (Pure color science)  │
│  /api/products/{s}    │ └────────────────────────┘
│  /api/palette-card    │
│  /api/auth/*          │
└──────────┬────────────┘
           │
    ┌──────▼──────┐    ┌───────────────┐
    │ CV Pipeline │    │  SQLite DB    │
    │ OpenCV +    │    │  Users        │
    │ MediaPipe + │    │  Palettes     │ 
    │ Face Parsing│    │  Free Scans   │
    │ Model (.pth)│    └───────────────┘
    └─────────────┘
```

### Data Flow

1. **Upload selfie** → Frontend sends to `POST /api/analyze`
2. **Face detection** → MediaPipe detects face landmarks
3. **Skin masking** → Face parsing model isolates skin pixels
4. **Color extraction** → K-Means clustering on skin region
5. **Season mapping** → ITA angle + undertone → 12-season classification
6. **Enrichment** → `seasons.json` adds celebrities, makeup, avoid colors
7. **Response** → Full JSON result displayed on Results page
8. **Palette saved** → Stored in SQLite for the Buy or Pass scanner

---

##  Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15, React, TypeScript | App Router, Server Components |
| **Styling** | Tailwind CSS 4, Framer Motion | Glassmorphism, scroll animations |
| **Auth** | NextAuth.js v5 | Google OAuth + Email/Password |
| **Backend** | Python 3.12, FastAPI | Async API, Pydantic v2 schemas |
| **CV Pipeline** | OpenCV, MediaPipe, PyTorch | Face detection, skin parsing |
| **Color Science** | Custom (NumPy) | K-Means clustering, CIE2000 ΔE |
| **Database** | SQLite | User accounts, palette storage |
| **Security** | bcrypt, rate limiting | Password hashing, abuse prevention |

---

##  Project Structure

```
lumiqe/
├── backend/
│   ├── api.py                  # FastAPI server (all endpoints)
│   ├── lumiqe_engine.py         # CV pipeline (face → season)
│   ├── db.py                   # SQLite database (users, palettes)
│   ├── 79999_iter.pth          # Face parsing model weights
│   ├── blaze_face_short_range.tflite
│   ├── face-parsing/           # BiSeNet face parsing model
│   │   ├── model.py
│   │   └── resnet.py
│   ├── services/
│   │   ├── palette_card.py     # Shareable palette image generator
│   │   └── color_matcher.py    # Buy or Pass color science engine
│   ├── data/
│   │   ├── seasons.json        # 12-season knowledge base
│   │   ├── products.json       # Curated product catalog
│   │   └── demo_results.json   # Landing page demo data
│   ├── requirements.txt
│   └── test_api.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page (8 sections)
│   │   │   ├── analyze/        # Upload & scan selfie
│   │   │   ├── results/        # Full analysis report
│   │   │   ├── feed/           # Shopping recommendations
│   │   │   ├── scan/           # Buy or Pass scanner
│   │   │   └── api/auth/       # NextAuth.js handler
│   │   ├── components/         # 15+ reusable components
│   │   └── lib/                # Auth config, utilities
│   ├── tests/                  # Vitest unit tests
│   ├── package.json
│   └── tailwind.config.ts
├── context/
│   ├── architecture-rules.md
│   └── business-constraints.md
└── claude.md                   # Engineering principles
```

---

##  API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check + model status |
| `/api/analyze` | POST | Optional | Upload selfie → full color analysis |
| `/api/scan-item` | POST | Yes (email) | Upload clothing → match score |
| `/api/products/{season}` | GET | No | Curated products by season |
| `/api/demo-results` | GET | No | Pre-computed demos for landing page |
| `/api/palette-card` | POST | No | Generate downloadable palette PNG |
| `/api/auth/register` | POST | No | Create user account |
| `/api/auth/login` | POST | No | Authenticate user |

### Example Response: `/api/analyze`
```json
{
  "season": "Deep Autumn",
  "description": "Rich, warm, and muted tones...",
  "hex_color": "#B07848",
  "undertone": "warm",
  "confidence": 0.87,
  "palette": ["#8B4513", "#CD853F", "#D2691E", "#DEB887", "#C76B3F", "#A0522D"],
  "avoid_colors": ["#FF69B4", "#87CEEB", "#E6E6FA", "#98FB98"],
  "metal": "Gold",
  "celebrities": [{"name": "Julia Roberts", "image": "..."}],
  "makeup": {"lips": "#C44536", "blush": "#E07A5F", "eyeshadow": "#81B29A"}
}
```

### Example Response: `/api/scan-item`
```json
{
  "item_hex": "#B85C38",
  "item_name": "Burnt Sienna",
  "match_score": 87,
  "verdict": "BUY",
  "best_palette_match": "#C76B3F",
  "suggestions": [
    {"hex": "#C76B3F", "name": "Burnt Sienna", "delta_e": 4.2},
    {"hex": "#A0522D", "name": "Sienna", "delta_e": 8.1}
  ]
}
```

---

##  Business Model

| Tier | Price | Includes |
|------|-------|----------|
| **Free Trial** | $0 | 1 face analysis scan |
| **Premium** (planned) | $4.99/mo | Unlimited scans, unlimited Buy or Pass, priority support |

### Revenue Streams
- **Subscription fees** — Premium tier for power users
- **Affiliate commissions** — Product recommendations via Amazon.in links
- **B2B API** (future) — License the color matching engine to fashion retailers

### Unit Economics
- **Infrastructure cost**: ~$20/mo (CPU-only server, no GPU needed)
- **Per-analysis cost**: ~$0.001 (pure CPU computation)
- **Break-even**: ~5 premium subscribers/month

---

##  Privacy & Security

> **Your photos never leave our server's memory and are never saved.**

-  All image processing happens **in-memory only** — raw photos are never written to disk
-  Only derived color data (hex codes, season) is stored
-  Passwords hashed with **bcrypt** (industry standard)
-  Rate limiting on API endpoints (10 analyses/hour per IP)
-  File upload validation (10MB max, JPEG/PNG/WebP only)
-  CORS restricted to known origins
-  No third-party image processing APIs — all CV runs locally

---

##  Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+**
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/kanishk083/Lumiqe-ai.git
cd Lumiqe-ai
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file (optional, for production):
```env
# No .env needed for local development
# The server runs with defaults
```

Start the backend:
```bash
uvicorn api:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Start the frontend:
```bash
npm run dev
```

### 4. Open the App

Visit **http://localhost:3000** — you're ready to go!

---

##  Testing

```bash
# Frontend unit tests
cd frontend && npm test

# Backend endpoint test
cd backend && python test_api.py
```

---

## 🧠 How the Color Science Works

### Face Analysis Pipeline
1. **Face Detection** — MediaPipe BlazeFace finds the face region
2. **Skin Parsing** — BiSeNet face parsing model isolates skin pixels
3. **Lighting Correction** — CLAHE on L*a*b* L-channel
4. **Color Clustering** — K-Means (k=3-5) on skin pixels → dominant tone
5. **ITA Angle** — Individual Typology Angle classifies skin lightness
6. **Season Mapping** — Undertone + ITA → one of 12 seasonal types

### Buy or Pass Scanner
1. **Dominant Color** — K-Means (k=3) extracts the most prominent color from a clothing photo
2. **L\*a\*b\* Conversion** — RGB → XYZ → CIE L\*a\*b\* (device-independent color space)
3. **Delta-E 2000** — CIE standard for human-perceptual color distance
4. **Match Score** — `100 - (ΔE / 30 × 100)` → 0-100% score
5. **Verdict** — ≥70% = BUY ✅, 40-69% = MAYBE 🤔, <40% = PASS ❌

---

## 🗺️ Roadmap

- [x] Core CV pipeline (face → season)
- [x] FastAPI backend with full endpoint suite
- [x] Production landing page with 8+ sections
- [x] Rich results page (palette, celebrities, makeup, metals)
- [x] Auth (Google OAuth + Email/Password)
- [x] Free trial system with scan limits
- [x] Buy or Pass In-Store Scanner
- [ ] Premium subscription (Stripe integration)
- [ ] Dynamic product recommendations (SerpAPI)
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

##  Author

**Kanishk** — [GitHub](https://github.com/kanishk083)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
