# Lumiqe — Architecture Rules

> Canonical reference for the technology stack and architectural constraints.

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | React 19, TypeScript, Server Components by default |
| **Styling** | Tailwind CSS 4 | Mobile-first, dark mode support |
| **Backend API** | Python 3.12 + FastAPI | Async-first, Pydantic v2 models |
| **Image Pre-processing** | OpenCV (cv2) | Lighting correction, face detection, skin masking |
| **Color Clustering** | scikit-learn (KMeans) | Dominant skin-tone extraction from masked regions |
| **Season Mapping** | Custom module | 12-season color theory engine |
| **Database** | PostgreSQL 16 + pgvector | Product catalog with hex-code vector similarity search |
| **ORM** | SQLAlchemy 2.0 + Alembic | Async session, migration management |
| **Task Queue** (optional) | Celery + Redis | For async image processing if chosen |
| **Auth** | NextAuth.js v5 / JWT | Session-based on frontend, Bearer token to backend |
| **Deployment** | Docker Compose (dev), Vercel + Railway/Fly.io (prod) | |

---

## Architectural Constraints

### Frontend (Next.js 15)

1. **App Router only.** No Pages Router.
2. **Server Components by default.** Use `"use client"` only when interactivity is required.
3. **API calls go through Next.js Route Handlers** (`app/api/...`) as a BFF layer to the FastAPI backend.
4. **Image uploads** use presigned flow or direct POST with `FormData` to the BFF, which proxies to FastAPI.
5. **State management:** React Context + `useReducer` for global UI state. No Redux.

### Backend (FastAPI)

1. **Pydantic models** for every request body, response body, and internal DTO.
2. **Dependency Injection** via FastAPI `Depends()` for DB sessions, auth, and config.
3. **Repository pattern** for all database access. No raw SQL in route handlers.
4. **All image data stays in memory.** Read from `UploadFile`, process as numpy arrays, return results. Never write to disk.

### Computer Vision Pipeline

```
Upload → Decode (cv2.imdecode) → Face Detection (Haar/DNN)
  → Skin Region Masking (HSV thresholds + face ROI)
  → Lighting Correction (CLAHE on LAB L-channel)
  → K-Means Clustering (k=3..5 on skin pixels)
  → Dominant Tone Selection → Hex Conversion
  → 12-Season Mapping → Product Query (pgvector)
```

1. Pipeline is a composable chain of pure functions where possible.
2. Each step logs input shape, output shape, and timing.
3. Face detection failure → return explicit error, do NOT guess.

### Database (PostgreSQL + pgvector)

1. Products table stores a `color_embedding vector(3)` (RGB normalized to 0–1).
2. Similarity search uses cosine distance: `<=>` operator.
3. Season palette tables map each of the 12 seasons to an array of ideal hex ranges.
4. All queries use connection pooling (asyncpg via SQLAlchemy async).

### Testing Strategy

| Type | Tool | Scope |
|---|---|---|
| Unit (backend) | pytest + hypothesis | Pure functions, pipeline steps |
| Integration (backend) | pytest + httpx (TestClient) | API endpoints |
| Unit (frontend) | Vitest + React Testing Library | Components, hooks |
| E2E | Playwright | Critical user flows |

---

## Directory Layout (Target)

```
lumiqe/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route modules
│   │   ├── core/           # Config, security, dependencies
│   │   ├── cv/             # OpenCV + sklearn pipeline
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── repositories/   # DB access layer
│   │   ├── services/       # Business logic orchestration
│   │   └── main.py         # FastAPI app factory
│   ├── tests/
│   ├── alembic/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                # Next.js App Router
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── claude.md
└── context/
```
