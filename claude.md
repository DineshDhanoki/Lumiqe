# Lumiqe — Core Engineering Principles

> These rules are non-negotiable. Every contributor (human or AI) must follow them.

---

## 1. Plan First, Verify Always

- **No code without a plan.** Every feature starts with a written spec or implementation plan reviewed by a human.
- **No merge without verification.** Every PR must include evidence that it has been tested (automated or manual).

## 2. Tests First, Always

- Write property-based tests *before* implementation code.
- Unit tests cover pure logic. Integration tests cover API contracts.
- Target ≥ 90% coverage on the CV pipeline and API layer.

## 3. Reject Fancy One-Liners

- Prefer readable, explicit code over clever tricks.
- If a function exceeds 30 lines, refactor it.
- Name variables descriptively — `dominant_skin_hex` not `dsh`.

## 4. Computer Vision Pipeline Rules

- **Always verify image lighting** before color extraction. Run histogram equalization checks and reject or correct underexposed / overexposed images.
- **Never trust raw pixel values.** All skin-tone extraction must operate on a preprocessed, lighting-corrected image.
- **Log every pipeline step** with input/output metadata (dimensions, histogram stats, cluster centers) for debuggability.

## 5. Privacy by Design

- **All image processing happens server-side in memory.** Never persist raw user photos to disk or cloud storage.
- Processed color data (hex codes) is the only user-derived data stored.
- Comply with GDPR / data-minimization principles.

## 6. API Contract Discipline

- All endpoints must have OpenAPI schemas with explicit request/response models (Pydantic).
- Breaking API changes require a version bump (`/api/v2/...`).
- All API errors return structured JSON: `{ "error": str, "detail": str, "code": int }`.

## 7. Frontend Standards

- Mobile-first responsive design. Test on 375px viewport minimum.
- No layout shift on load. Use skeleton screens.
- All user-facing actions must have loading, success, and error states.

## 8. Performance Guardrails

- Image analysis endpoint must respond in < 3 seconds (p95) for images ≤ 5MB.
- Frontend Time-to-Interactive < 2 seconds on 4G.
- Database queries must use indexed lookups. No full-table scans.

## 9. Dependency Hygiene

- Pin all dependency versions. No `*` or `latest`.
- Audit dependencies quarterly for CVEs.
- Prefer stdlib / well-maintained libraries over niche packages.

## 10. Git Discipline

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- Feature branches off `main`. Squash-merge only.
- Never commit secrets, `.env` files, or large binary assets.
