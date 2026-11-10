<div align="center">

# Lumiqe

### Colour is personal. Your tools should be, too.

**An open-source personal-colour companion that turns a thoughtful photo into a palette you can actually use.**

[Explore Lumiqe](https://www.lumiqe.in/) · [Read the contribution guide](CONTRIBUTING.md) · [Choose an issue](https://github.com/DineshDhanoki/Lumiqe/issues) · [Star the project](https://github.com/DineshDhanoki/Lumiqe)

![CI](https://github.com/DineshDhanoki/Lumiqe/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/license-MIT-1a1a1a.svg?style=flat-square)](LICENSE)

</div>

> *You know the feeling: two outfits fit, but only one makes you feel entirely like yourself.*
>
> Lumiqe exists for the space between “I like this colour” and “I know how to wear it.” It is a collaborative attempt to make personal colour analysis more practical, more transparent, and more welcoming to every person in front of the camera.

<br />

## A small moment. A more confident wardrobe.

Getting dressed should not require a second-guessing spiral, a drawer full of “maybe” purchases, or a rigid rule about what someone else says you can wear. Lumiqe starts with a clear photo and gives you a place to explore: a likely colour season, a portable palette, styling prompts, and ways to compare the colours already in your life.

It is not here to tell anyone who they are. It is here to help them notice what feels good—and to make the next choice a little easier.

| Begin with a photo | Find a direction | Take it into real life |
| :--- | :--- | :--- |
| Upload a clear selfie or use the camera. | Explore a 12-season colour estimate and a palette. | Compare items, save ideas, and shop with more intention. |

<details>
<summary><strong>What does Lumiqe currently include?</strong></summary>

<br />

- A photo-based colour-analysis flow with face detection, skin segmentation, colour measurements, and a 12-season estimate.
- Palette cards, outfit and beauty guidance, a wardrobe area, colour/item scanning, and shareable results.
- Optional account, shopping, and AI-stylist experiences where their required services are configured.
- A Next.js frontend, FastAPI backend, PostgreSQL/Redis services, and a contributor-friendly test suite.

</details>

## Built for curiosity, not certainty.

Personal colour analysis is subjective. A camera, lighting, makeup, image processing, and display settings can all change what a photo says about colour. Lumiqe's season and confidence value are model outputs—not a professional diagnosis, a beauty standard, or a promise that a shade will suit everyone in the same way.

That is a feature of the project, not a footnote. We want to make the system better in the open: test it across real-world lighting and skin tones, explain its limits plainly, and leave room for a person's own taste to have the final word.

## Follow the light

```text
your photo
    ↓
face detection + skin segmentation
    ↓
colour correction + CIE Lab measurements
    ↓
12-season estimate
    ↓
a palette, ideas, and a starting point for your own eye
```

Behind that simple journey is a project with room for many kinds of builders. The frontend is built with **Next.js, React, TypeScript, and Tailwind CSS**. The API uses **FastAPI**, OpenCV, MediaPipe, PyTorch, and colour measurements in CIE Lab. PostgreSQL stores account data; Redis supports rate limiting and other stateful services. Optional integrations include Groq, Stripe, Resend, and product-data providers.

The code is only half the work. The other half is making a colour tool that deserves people’s trust.

## Try Lumiqe

Visit **[lumiqe.in](https://www.lumiqe.in/)** to experience the hosted app.

For the most useful first result, choose a clear, evenly lit image with your face visible. The analysis endpoint accepts JPEG, PNG, and WebP images up to 10 MB. Before uploading any image, please read the hosted app’s [privacy page](https://www.lumiqe.in/privacy). Use your own images, and never share other people’s photos in public issues or pull requests.

## Bring it to your machine

Lumiqe is a full-stack project, but you do not need to run every service to make a meaningful contribution. Frontend, documentation, design, accessibility, and many test improvements can begin without the analysis API.

### The honest setup note

The BiSeNet checkpoint expected at `backend/79999_iter.pth` is **not included** in this repository, and the sample configuration does not provide a public download URL. To start the analysis backend, use a compatible checkpoint you are permitted to use at that path, or set a direct `BISENET_WEIGHTS_URL` as described below. The smaller MediaPipe face model downloads automatically.

We are actively interested in a documented, licence-checked model setup. If that is your kind of problem, [start a conversation](https://github.com/DineshDhanoki/Lumiqe/issues).

### Model weights

On startup the backend runs `ensure_models()` from `backend/download_models.py`, which checks for two files in the `backend/` directory:

| File | Expected path | How it gets there |
| :--- | :--- | :--- |
| BiSeNet face-parsing checkpoint | `backend/79999_iter.pth` | Place it there yourself, or let it download from `BISENET_WEIGHTS_URL`. |
| MediaPipe face detector | `backend/blaze_face_short_range.tflite` | Downloaded automatically from the MediaPipe CDN if missing. |

You have two options for the BiSeNet checkpoint:

1. **Local file** — copy a compatible checkpoint you are permitted to use to `backend/79999_iter.pth` (exactly this filename, directly inside `backend/`). If the file exists, no download is attempted.
2. **`BISENET_WEIGHTS_URL`** — set this to a *direct* download link for the `.pth` file (for example a Hugging Face, GitHub Releases, or other CDN URL you control or are permitted to use). If `backend/79999_iter.pth` is missing, it is downloaded to that path on startup. `download_models.py` reads the value from the process environment, so export it in the shell that starts the backend:

   ```bash
   export BISENET_WEIGHTS_URL="https://example.com/path/to/79999_iter.pth"
   ```

   You can also fetch the files ahead of time with `python download_models.py` from the `backend/` directory.

   **Important:** `download_models.py` reads `BISENET_WEIGHTS_URL` with `os.getenv()` when it is imported. Put the variable in your deployment environment or export it before starting the backend; placing it only in `backend/.env` is not sufficient for the downloader in the current implementation.

   For example, a local backend startup with a hosted checkpoint looks like this:

   ```bash
   cd backend
   export BISENET_WEIGHTS_URL="https://example.com/path/to/79999_iter.pth"
   uvicorn app.main:app --reload --port 8000
   ```

   Use an HTTPS URL from a trusted source, confirm that it serves the raw `.pth` file (not an HTML download page), and verify the checkpoint's licence and integrity before using it in production.

**Troubleshooting a missing checkpoint:** if startup fails with `79999_iter.pth is missing and BISENET_WEIGHTS_URL env var is not set` (or the analysis endpoint reports `Model weights not found at ...`), check that the file is at `backend/79999_iter.pth` with that exact name, or that `BISENET_WEIGHTS_URL` is exported in the environment of the process running `uvicorn`. If you see `Failed to download 79999_iter.pth`, make sure the URL is reachable and returns the raw file rather than an HTML page; a partial download is deleted automatically, so you can simply retry.

### Local quickstart

You will need **Python 3.12**, **Node.js 22**, and **npm**. PostgreSQL with pgvector and Redis support the account and stateful features; Docker Compose can start them locally.

### Frontend-only quickstart

You can work on the landing pages, layouts, accessibility, and most component tests without installing Python, PostgreSQL, Redis, model weights, or backend credentials.

```bash
git clone https://github.com/DineshDhanoki/Lumiqe.git
cd Lumiqe/frontend
npm ci
```

Create `frontend/.env.local` with these local values:

```bash
NEXTAUTH_SECRET=<paste the output of: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXTAUTH_SECRET` is required by the NextAuth middleware, while `NEXTAUTH_URL` identifies the local callback origin. `NEXT_PUBLIC_API_URL` points API requests at the backend; it can remain `http://localhost:8000` while you work on frontend-only areas. Google OAuth and other provider credentials are optional until you work on sign-in or the related integration.

Start the frontend:

```bash
npm run dev
```

Open <http://localhost:3000>. Without a running backend, pages that need API data—such as photo analysis, authentication, account data, dashboards, shopping data, and saved results—cannot complete their requests. The landing page, static content, responsive layouts, upload UI, and frontend component tests remain available for development. Run the local frontend checks before opening a pull request:

```bash
npm run lint
npm run typecheck
npm test -- --run
```

```bash
git clone https://github.com/DineshDhanoki/Lumiqe.git
cd Lumiqe
cp backend/.env.example backend/.env
docker compose up -d postgres redis
```

Generate a value for `JWT_SECRET_KEY` with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

Add it to `backend/.env`, set `DATABASE_URL` for your PostgreSQL instance, and configure the permitted BiSeNet checkpoint as described above. Optional service keys can remain unset while you work on an independent area.

Then start the backend:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Verify the local API

With the backend running, check its public health endpoint:

```bash
curl -fsS http://localhost:8000/api/health
```

The endpoint returns HTTP `200` with a JSON response like this:

```json
{
  "status": "degraded",
  "version": "3.0.0",
  "dependencies": {
    "database": {"status": "connected", "latency_ms": 2.1},
    "redis": {"status": "connected", "latency_ms": 0.8},
    "cv_engine": {"status": "not_loaded", "model": "BiSeNet"}
  },
  "uptime_seconds": 12.4
}
```

`status` is `healthy` when all dependencies are ready; it is `degraded` when a dependency is disconnected, unavailable, or not loaded. A `degraded` response is still useful during local setup because it shows which service needs attention. Once the backend is running, browse the interactive [OpenAPI documentation](http://localhost:8000/docs) for the available endpoints.

In a second terminal, start the frontend:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local` with:

```bash
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run `npm run dev` and open <http://localhost:3000>. The API reference is available at <http://localhost:8000/docs> when the backend is running.

## Help write the next chapter

The most valuable contribution may not be a new feature. It may be the sentence that makes setup clearer, the keyboard path that makes a screen usable, the test that reveals a blind spot, or the evaluation plan that stops us from making a claim we cannot support.

| If you care about… | Lumiqe needs help with… |
| :--- | :--- |
| **Experience** | Mobile polish, keyboard navigation, screen-reader support, visual clarity, and translations. |
| **Trust** | Reproducible evaluation across lighting and skin tones, privacy tests, and honest confidence reporting. |
| **Developer experience** | Smaller local setup, fixtures, component previews, documentation, and clearer errors. |
| **Utility** | Palette explanations, wardrobe flows, product matching, and tools that help people act on a result. |

**Ready to make a first mark?** Pick a [good first issue](https://github.com/DineshDhanoki/Lumiqe/labels/good%20first%20issue), browse [all open issues](https://github.com/DineshDhanoki/Lumiqe/issues), or open an issue to discuss a larger idea before implementing it. Thoughtful design feedback, bug reports, and documentation improvements are contributions too.

Please read the [contribution guide](CONTRIBUTING.md), [code of conduct](CODE_OF_CONDUCT.md), and [security policy](SECURITY.md) before you begin. Maintainers review pull requests before merging; feedback is how we make the work stronger together.

## Quality bar

Run the checks for the part of the project you touch:

```bash
# frontend/
npm run lint
npm run typecheck
npm test -- --run

# backend/ (with development dependencies installed)
ruff check app/
pytest tests/ -q
```

GitHub Actions also runs frontend, end-to-end, and backend checks for pull requests. See [.github/workflows/ci.yml](.github/workflows/ci.yml) for the exact commands. A green check means the code met its automated checks; it does not prove that a colour recommendation is accurate, fair, or lighting-invariant.

## Open source, with care

Lumiqe is an active experiment, not a finished or clinically validated styling service. Some experiences rely on commercial APIs, hosted accounts, or product catalogues that are not included in the source release. Never commit secrets, API keys, or real user photos.

The source code is available under the [MIT License](LICENSE). Model weights, fonts, images, and other third-party materials may carry their own licences—check their source before redistributing them.

---

<div align="center">

**Lumiqe is being built in public by [Dinesh Dhanoki](https://github.com/DineshDhanoki), Kanishk, and contributors who believe personal style can be more curious than prescriptive.**

If this is the kind of tool you want to exist, [star the repository](https://github.com/DineshDhanoki/Lumiqe) and help shape what it becomes.

</div>
