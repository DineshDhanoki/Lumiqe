<div align="center">

<img src="https://img.shields.io/badge/LUMIQE-AI%20Color%20Intelligence-FF2D55?style=for-the-badge&labelColor=000000" alt="Lumiqe" />

<br/><br/>

# ✦ LUMIQE
### *Your Personal AI Color Consultant*

**Discover the exact colors that make you look extraordinary.**
Professional-grade seasonal color analysis — powered by computer vision, delivered in seconds.

<br/>

[![Stars](https://img.shields.io/github/stars/DineshDhanoki/lumiqe?style=social)](https://github.com/DineshDhanoki/lumiqe/stargazers)
[![Forks](https://img.shields.io/github/forks/DineshDhanoki/lumiqe?style=social)](https://github.com/DineshDhanoki/lumiqe/network/members)
&nbsp;
![Python](https://img.shields.io/badge/Python_3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)
&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<br/>

> 💡 **If this project helps you, please give it a ⭐ — it means the world and helps others find it!**

<br/>

---

</div>

## 🎯 What is Lumiqe?

Most people wear the wrong colors their entire life — not because they lack style, but because nobody ever told them their season.

A professional color analysis consultation costs **$200–$500**. Lumiqe does it in **3 seconds**, for free.

Upload a selfie (or use the live camera), and Lumiqe's AI identifies your **12-season color type** using the same science professional stylists use. You'll get a complete color blueprint — what to wear, what to avoid, how to do your makeup, how to build your wardrobe, and an AI stylist you can chat with 24/7.

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 Core Analysis
- **12-Season Color Typing** — Light/True/Warm Spring, Light/True/Soft Summer, Soft/True/Deep Autumn, Deep/True/Bright Winter
- **Live Camera Capture** — Real-time lighting guidance, face alignment oval, 3-second countdown
- **Skin Tone Detection** — BiSeNet face parsing + MediaPipe + K-Means clustering
- **Confidence Scoring** — Know how reliable your result is
- **Celebrity Matches** — Famous people who share your season

</td>
<td width="50%">

### 💼 Professional Depth
- **Color Profile Deep Dive** — Style archetype, signature color, value, chroma, harmonies
- **7-Occasion Style Guide** — Work, formal, casual, date night, beach, wedding, athletic
- **10-Piece Capsule Wardrobe** — Each piece with hex code and reasoning
- **Hair & Beauty Guide** — Best shades, highlights to get, colors to avoid
- **AI Stylist Chat** — Conversational styling advice powered by Llama 3.3 70B

</td>
</tr>
<tr>
<td>

### 🛍️ Shopping Intelligence
- **Buy or Pass Scanner** — Snap any clothing item in-store, get an instant match score
- **Curated Shopping Feed** — Products filtered to your exact palette
- **Delta-E Color Science** — CIE2000 standard for perceptually accurate matching

</td>
<td>

### 🔒 Privacy First
- **Photos never saved** — All processing happens in-memory only
- **No third-party image APIs** — Your face never leaves the server
- **GDPR-aligned** — Only derived color data (hex codes) is stored

</td>
</tr>
</table>

<br/>

## 🖥️ Screenshots

> *Take a selfie → Get your complete color universe in seconds*

```
┌─────────────────────┐    ┌─────────────────────────────────────────┐
│                     │    │  Overview │ Profile │ Occasions │ ...    │
│   📷 Live Camera    │ →  │                                         │
│                     │    │  ✦ Deep Autumn                          │
│  [ Face Oval Guide ]│    │  Your Core Palette  ████ ████ ████      │
│  ✓ Good lighting    │    │  Best Metal: Gold                        │
│                     │    │  Contrast: High                          │
│  [ Capture Photo ]  │    │                                         │
└─────────────────────┘    └─────────────────────────────────────────┘
```

<br/>

## 🧠 How the Science Works

```
📸 Selfie
   │
   ▼
👤 Face Detection        — MediaPipe BlazeFace isolates the face region
   │
   ▼
🎭 Skin Segmentation     — BiSeNet model masks skin pixels only (ignores hair, eyes, lips)
   │
   ▼
💡 Lighting Correction   — CLAHE on L*a*b* L-channel removes harsh shadows
   │
   ▼
🎨 Color Extraction      — K-Means++ clusters skin pixels → dominant tone
   │
   ▼
📐 ITA Angle Calculation — Individual Typology Angle classifies skin lightness
   │
   ▼
🌸 Season Mapping        — Undertone + ITA → 1 of 12 seasonal color types
   │
   ▼
📚 Profile Enrichment    — seasons.json adds palette, occasions, wardrobe, beauty guide
   │
   ▼
✨ Your Complete Color Blueprint
```

<br/>

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                   │
│         Landing • Analyze • Results (6 tabs) • Feed        │
│              Scanner • Account • Pricing                    │
│                  NextAuth.js v5 (Google + Email)            │
└────────────────┬───────────────────────────────────────────┘
                 │  REST API
                 ▼
┌────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI + Python 3.12)           │
│                                                            │
│  /api/analyze          →  CV Pipeline                      │
│  /api/complete-profile →  seasons.json enrichment          │
│  /api/color-chat       →  Groq Llama 3.3 70B               │
│  /api/scan-item        →  Delta-E color matching           │
│  /api/styling-tips     →  AI fashion advice                │
│  /api/auth/*           →  JWT authentication               │
└──────────┬─────────────────────────────────────────────────┘
           │
   ┌───────▼────────┐    ┌──────────────────┐    ┌──────────────┐
   │  CV Pipeline   │    │   PostgreSQL DB   │    │  Groq API    │
   │  OpenCV        │    │  Users • Palettes │    │  Llama 3.3   │
   │  MediaPipe     │    │  Scan credits     │    │  70B         │
   │  BiSeNet .pth  │    └──────────────────┘    └──────────────┘
   └────────────────┘
```

<br/>

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm

### 1. Clone

```bash
git clone https://github.com/DineshDhanoki/lumiqe.git
cd lumiqe
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and add your JWT_SECRET_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local:
#   NEXTAUTH_SECRET=any-random-string
#   NEXTAUTH_URL=http://localhost:3000
#   NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

### 4. Open

Visit **http://localhost:3000** ✨

> **No database?** No problem. The app works fully without PostgreSQL — auth endpoints gracefully return 503, while the entire analysis + results experience works perfectly.

<br/>

## 📡 API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | — | Health check + model status |
| `/api/analyze` | POST | Optional | Selfie → full 12-season analysis |
| `/api/complete-profile` | GET | — | Full professional season profile |
| `/api/color-chat` | POST | Optional | AI stylist conversation |
| `/api/styling-tips` | GET | Optional | Personalized fashion advice |
| `/api/scan-item` | POST | Yes | Clothing photo → Buy/Pass verdict |
| `/api/palette-card` | POST | — | Generate downloadable palette PNG |
| `/api/auth/register` | POST | — | Create account |
| `/api/auth/login` | POST | — | Authenticate |

<details>
<summary><strong>Example: POST /api/analyze response</strong></summary>

```json
{
  "season": "Deep Autumn",
  "description": "Rich, warm, and grounded — your coloring has depth and intensity...",
  "hex_color": "#B07848",
  "undertone": "warm",
  "confidence": 0.91,
  "contrast_level": "High",
  "palette": ["#8B4513", "#CD853F", "#D2691E", "#DEB887", "#C76B3F", "#A0522D"],
  "avoid_colors": ["#FF69B4", "#87CEEB", "#E6E6FA"],
  "metal": "Gold",
  "makeup": { "lips": "#C44536", "blush": "#E07A5F", "eyeshadow": "#81B29A" },
  "celebrities": [{ "name": "Julia Roberts", "season": "Deep Autumn" }]
}
```

</details>

<br/>

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Auth** | NextAuth.js v5 — Google OAuth + Email/Password |
| **Backend** | Python 3.12, FastAPI, Pydantic v2 |
| **Computer Vision** | OpenCV, MediaPipe BlazeFace, PyTorch (BiSeNet) |
| **Color Science** | K-Means++, CIE L\*a\*b\*, Delta-E CIE2000, ITA angle |
| **AI / LLM** | Groq API — Llama 3.3 70B (styling tips + chat) |
| **Database** | PostgreSQL + pgvector (graceful fallback without it) |
| **Security** | bcrypt, JWT, rate limiting, magic-byte validation |

<br/>

## 🗺️ Roadmap

- [x] CV pipeline — face detection → 12-season classification
- [x] FastAPI backend with full endpoint suite
- [x] 6-tab results experience (Overview, Profile, Occasions, Wardrobe, Beauty, AI Chat)
- [x] Professional season profiles — occasions, capsule wardrobe, hair & beauty
- [x] AI Stylist chat — conversational styling powered by Llama 3.3 70B
- [x] Live camera capture with real-time lighting guidance
- [x] Buy or Pass in-store scanner
- [x] Curated shopping feed
- [ ] Stripe subscription (Premium tier)
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Outfit builder — combine pieces from your wardrobe formula
- [ ] Body shape analysis

<br/>

## 🤝 Contributing

Contributions are very welcome! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

Please read [CLAUDE.md](CLAUDE.md) for engineering principles and code standards.

<br/>

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

<br/>

---

<div align="center">

**Built with ❤️ by [Dinesh Dhanoki](https://github.com/DineshDhanoki)**

*If Lumiqe helped you discover your colors, please consider giving it a ⭐*
*It helps more people find the project and motivates continued development.*

<br/>

[![Star this repo](https://img.shields.io/badge/⭐%20Star%20this%20repo-FF2D55?style=for-the-badge)](https://github.com/DineshDhanoki/lumiqe/stargazers)
[![Fork this repo](https://img.shields.io/badge/🍴%20Fork%20this%20repo-000000?style=for-the-badge)](https://github.com/DineshDhanoki/lumiqe/fork)

</div>
