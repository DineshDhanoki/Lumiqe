# Lumiqe frontend

This is the Next.js interface for [Lumiqe](../README.md). Start with the root README for the project story, backend setup, and contribution areas.

## Run locally

With the backend available at `http://localhost:8000`, create `.env.local` in this directory:

```text
NEXTAUTH_SECRET=<random value from openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Then run `npm ci` and `npm run dev`. Open <http://localhost:3000>. Account, AI, shopping, and payment flows may require their backend services and optional credentials. See the root README for the missing model checkpoint setup blocker.

Run `npm run lint`, `npm run typecheck`, and `npm test -- --run` before opening a pull request. See [CONTRIBUTING.md](../CONTRIBUTING.md) for the review process.
