# Lumiqe Deploy Checklist

## 1. Database Migrations

Run all migrations in order before deploying the new application version.

- [ ] **Migration 1 — Product indexes & price_cents**
  Add `price_cents` integer column to `products` table. Create indexes on `products(category)`, `products(season)`, and `products(price_cents)` for fast filtered lookups.

- [ ] **Migration 2 — email_verified flag**
  Add `email_verified BOOLEAN DEFAULT FALSE` column to the `users` table. Backfill existing Google-OAuth users to `TRUE`.

- [ ] **Migration 3 — Wishlist, wardrobe & outfit tables**
  Create `wishlists`, `wardrobe_items`, and `outfits` tables with foreign keys to `users` and `products`. Add composite indexes on `(user_id, product_id)`.

- [ ] **Migration 4 — B2B, creator & community tables**
  Create `b2b_keys`, `b2b_usage_logs`, `creator_profiles`, `community_posts`, and `community_votes` tables. Add indexes on `b2b_keys(api_key)` and `community_posts(created_at)`.

## 2. Environment Variables

Set the following in your deployment environment (K8s Secret, `.env`, or CI/CD variables).

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | **Yes** | OAuth 2.0 client ID for Google Sign-In. App will not start without this. |
| `RESEND_API_KEY` | No (degrades gracefully) | API key for Resend transactional email service. Email features disabled if absent. |
| `REDIS_URL` | No (degrades gracefully) | Redis connection string for caching and rate limiting. Falls back to in-memory if absent. |
| `STRIPE_WEBHOOK_SECRET` | No (degrades gracefully) | Webhook signing secret for Stripe payment events. Payment webhooks rejected if absent. |

## 3. Verification Steps

After deployment, run through each step and confirm it passes.

- [ ] **Health check** — `GET /api/health` returns `200 OK` with `{"status": "healthy"}`.
- [ ] **Database connectivity** — Health endpoint confirms DB connection pool is active (check logs for `Database connected` message).
- [ ] **Google OAuth flow** — Complete a full sign-in and sign-up flow via Google. Verify the user record is created with `email_verified = true`.
- [ ] **Image analysis** — Upload a test selfie to `POST /api/analyze`. Confirm a valid seasonal color result is returned within 3 seconds.
- [ ] **B2B API key auth** — Call `POST /api/b2b/analyze` with a valid API key in the `Authorization: Bearer <key>` header. Verify the response matches the standard analysis schema.
- [ ] **Usage tracking** — After the B2B call above, hit `GET /api/b2b/usage` and confirm `calls_this_month` incremented.
- [ ] **Redis caching** — Analyze the same image twice. Second call should return faster (check `X-Cache: HIT` header or response time < 500ms).
- [ ] **Stripe webhook** — Send a test webhook event from the Stripe dashboard (or via `stripe trigger`). Confirm the backend logs show successful signature verification and event processing.
