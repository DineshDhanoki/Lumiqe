# Lumiqe

### What if the colors in your wardrobe felt like *you*?

You are getting dressed for something that matters. You hold two shirts up to the mirror. Both fit. One makes you feel alive; the other somehow does not. Most of us know that moment, but few of us can explain why.

**Lumiqe is an open source experiment in making that choice easier.** Give it a clear photo, and it estimates a seasonal color palette. Then explore outfit ideas, compare a clothing item with your palette, and carry a color card when you shop. We want to build a more useful starting point for personal style, improved by people with different skin tones, cameras, lighting, and perspectives.

[Try Lumiqe](https://www.lumiqe.in/) · [Explore the code](#how-it-works) · [Find a contribution](https://github.com/DineshDhanoki/Lumiqe/issues) · [Contributor guide](CONTRIBUTING.md)

![CI](https://github.com/DineshDhanoki/Lumiqe/actions/workflows/ci.yml/badge.svg) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **A useful guide, not a verdict.** Seasonal color analysis is subjective, and a photo changes with lighting, camera processing, makeup, and screen settings. Lumiqe's season and confidence score are model outputs, not a professionally validated diagnosis or a guarantee that a color will suit you. Try the palette, keep what you love, and help us measure where the model falls short.

## See the idea

1. **Start with a selfie.** The API accepts JPEG, PNG, and WebP images up to 10 MB. A clear, evenly lit face helps.
2. **Explore a palette.** The backend detects a face, estimates skin color, and maps its measurements to one of 12 seasonal categories. It returns colors and styling suggestions.
3. **Make it your own.** The app includes a palette card, item scanner, wardrobe, shopping ideas, and an optional AI stylist. Some features need an account, external services, or a configured product catalog.

The [live app](https://www.lumiqe.in/) is a hosted experience. You can also run the project locally and contribute to its frontend, API, computer vision pipeline, documentation, tests, and accessibility.

## How it works

```text
Photo → face detection → skin segmentation → color correction
      → color measurements → season estimate → palette and recommendations
```

The frontend uses **Next.js, React, TypeScript, and Tailwind CSS**. The **FastAPI** backend uses OpenCV, MediaPipe, PyTorch, and color measurements in CIE Lab. PostgreSQL stores accounts and saved data; Redis supports rate limiting and other stateful features. Optional integrations include Groq, Stripe, Resend, and product data services. Browse [frontend/src](frontend/src), [backend/app](backend/app), and the API docs at `http://localhost:8000/docs` when running locally.

The color pipeline is an **estimate under real-world photo conditions**. We have not published a representative accuracy, fairness, or latency benchmark. Better evaluation across lighting and skin tones is an important contribution area. Please do not describe its results as exact or lighting invariant without evidence.

## Run it locally

**You need:** Python 3.12, Node.js 22, and npm. PostgreSQL with pgvector and Redis are needed for account and stateful features. Docker Compose can start those services.

**Current setup blocker:** The BiSeNet checkpoint `backend/79999_iter.pth` is not included in this repository, and the sample configuration has no public download URL. Backend startup requires you to obtain a compatible checkpoint from a source you are permitted to use and place it at that path, or set `BISENET_WEIGHTS_URL` to a direct download URL in `backend/.env`. The smaller MediaPipe face model downloads automatically. We are tracking a documented, license-checked model setup as a contributor task. Frontend-only work can proceed without running the analysis API.

```bash
git clone https://github.com/DineshDhanoki/Lumiqe.git
cd Lumiqe
cp backend/.env.example backend/.env
```

Generate a random secret with `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` and put it in `backend/.env` as `JWT_SECRET_KEY`. Set `DATABASE_URL` for your PostgreSQL instance. Optional service keys can remain unset while working on independent parts of the app.

From the **repository root**, start the database services if you use Docker:

```bash
docker compose up -d postgres redis
```

In one terminal:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

In a **new terminal from the repository root**:

```bash
cd frontend
npm ci
```

Create `frontend/.env.local` with `NEXTAUTH_SECRET` (generate one with `openssl rand -base64 32`), `NEXTAUTH_URL=http://localhost:3000`, and `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`. Then run `npm run dev` and open <http://localhost:3000>.

The app has many integrations. If you are contributing to one area, you do not need to configure every service. Some screens and API routes will be unavailable until their dependencies are configured. Never commit `.env` files, API keys, or real user photos.

## Find your first contribution

There is more to build than another feature:

- **Make it welcoming:** clearer errors, keyboard navigation, screen reader labels, mobile polish, and translations.
- **Make it trustworthy:** reproducible evaluation across lighting and skin tones, privacy tests, and honest confidence reporting.
- **Make it easier to run:** smaller local setup, fixture data, and isolated component previews.
- **Make it useful:** better palette explanations, wardrobe flows, and product matching.

Look for [good first issues](https://github.com/DineshDhanoki/Lumiqe/labels/good%20first%20issue) or [open issues](https://github.com/DineshDhanoki/Lumiqe/issues). If you have another idea, open an issue before a large implementation. Design feedback and careful bug reports are contributions too.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests, and the pull request process. Read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations. Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Project status and boundaries

Lumiqe is an active open source project, not a finished or clinically validated styling service. The repository includes features that depend on commercial APIs; their keys, hosted accounts, and product catalogs are not part of the source release. A green CI run checks code health, not the real-world quality of color recommendations. Feedback from users and contributors is how we improve that.

**Photo privacy:** images are sent to the backend for analysis. Use your own test images or synthetic fixtures, and avoid posting faces, access tokens, or personal account data in public issues. For details of the hosted app's data handling, review its [privacy page](https://www.lumiqe.in/privacy) before uploading a photo.

## Development checks

```bash
# from frontend/
npm run lint
npm run typecheck
npm test -- --run

# from backend/ with dev dependencies installed
ruff check app/
pytest tests/ -q
```

GitHub Actions also runs frontend, end-to-end, and backend checks on pull requests. See [.github/workflows/ci.yml](.github/workflows/ci.yml) for the exact commands.

## License

Lumiqe's source code is available under the [MIT License](LICENSE). Dependencies, model weights, fonts, images, and other third-party assets may have separate licenses; check their source before reusing them outside this project.

Built by [Dinesh Dhanoki](https://github.com/DineshDhanoki) and Kanishk, with room for you. If Lumiqe helps you or you want to follow its progress, [star the repository](https://github.com/DineshDhanoki/Lumiqe) and come build with us.
