# Lumiqe — Business Constraints

> Hard constraints that every technical decision must respect.

---

## 1. Performance SLAs

| Metric | Target | Measurement |
|---|---|---|
| Image analysis latency (p50) | < 1.5 s | Server-side, from upload receipt to JSON response |
| Image analysis latency (p95) | < 3.0 s | Server-side, for images ≤ 5 MB |
| Product match query (p95) | < 200 ms | pgvector cosine similarity, top-20 results |
| Frontend TTI (4G, mobile) | < 2.0 s | Lighthouse, throttled 4G preset |
| Frontend LCP | < 2.5 s | Core Web Vitals |
| API uptime | ≥ 99.5% | Monthly, excluding scheduled maintenance |

## 2. Mobile-First Frontend

- **Primary target:** Mobile browsers (iOS Safari, Chrome Android).
- **Minimum viewport:** 375 × 667 px (iPhone SE).
- **Touch targets:** Minimum 44 × 44 px per Apple HIG.
- **Camera integration:** Must support direct camera capture (`<input accept="image/*" capture="environment">`).
- **Offline graceful degradation:** Show cached results / "no connection" UI. Do not crash.
- **Progressive image loading:** Thumbnail → full resolution on product cards.

## 3. Privacy — Local-Only Image Processing

> **This is a legal and trust requirement. No exceptions.**

- **Raw user images are NEVER stored** — not on disk, not in object storage, not in logs.
- Image bytes are read into memory, processed, and discarded within the same request lifecycle.
- Only *derived color data* (hex codes, season classification) is persisted, with user consent.
- No third-party image processing APIs (no Google Vision, no AWS Rekognition, etc.).
- All CV processing runs on **our own infrastructure** (FastAPI server with OpenCV/sklearn).
- Privacy policy must clearly state: *"Your photos never leave our server's memory and are never saved."*

## 4. Image Upload Constraints

| Constraint | Value |
|---|---|
| Max file size | 5 MB |
| Accepted formats | JPEG, PNG, WebP |
| Min resolution | 640 × 480 px |
| Max resolution | 4096 × 4096 px (downscale if larger) |
| Faces required | Exactly 1 face detected |

## 5. User Data & Consent

- Users must explicitly opt-in before any analysis.
- Analysis results (season, palette) are tied to an authenticated user account.
- Users can delete all their data at any time ("right to be forgotten").
- No selling or sharing of user data with third parties.

## 6. Product Catalog

- Products are sourced from affiliate APIs or manual curation (Phase 1: manual seed data).
- Each product must have: name, brand, price, image URL, primary color hex, category.
- Color embeddings are precomputed at catalog ingestion time.
- Catalog refresh cadence: daily (Phase 1: manual).

## 7. Cost Constraints (Phase 1)

- **No paid ML APIs.** All inference is local (OpenCV, sklearn).
- **Infrastructure budget:** ≤ $50/month for dev/staging.
- **Production target:** ≤ $150/month at < 1000 DAU.
- Prefer serverless / scale-to-zero where possible for non-CV workloads.
