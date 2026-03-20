# Stage 1 and Stage 2 Implementation

## Scope delivered

- Open-access OTP onboarding with development OTP simulation.
- Profile setup fields aligned to Stage 1:
  - name
  - DOB (14+ validation enforced)
  - optional profile photo URL
  - interests (minimum 3 unique)
  - neighbourhood
- Hyderabad school index search + self-reported school selection.
- Terms acceptance capture with policy version tracking.
- In-app notification centre foundation:
  - list notifications
  - mark one as read
  - mark all as read
- Theme preference support (`system`, `light`, `dark`) for dark mode parity from day one.
- Stage 2 discovery APIs and mobile shell coverage:
  - Pulse feed with spotlight, this week, and private friends-going section.
  - Events browse with category and price filters.
  - Event detail with organiser block, updates feed, and private friends attending.
  - 4-step application flow: review, details, payment intent, confirmation with QR ticket payload.
  - Social graph: user discovery, friend requests, friend list, privacy-aware profile views.
  - Minimal landing content endpoints and organiser intake submission API.

## API contracts

- `GET /health`
- `GET /terms/current`
- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /me`
- `PUT /me/onboarding`
- `PUT /me/theme`
- `GET /schools`
- `GET /notifications`
- `POST /notifications/read-all`
- `POST /notifications/:notificationId/read`
- `GET /pulse`
- `GET /events`
- `GET /events/:eventId`
- `POST /events/:eventId/applications/start`
- `POST /applications/:applicationId/details`
- `POST /applications/:applicationId/payment-intent`
- `POST /applications/:applicationId/confirm-payment`
- `GET /tickets/:ticketId`
- `GET /users/discover`
- `GET /friends`
- `GET /friends/requests`
- `POST /friends/requests`
- `POST /friends/requests/:requestId/respond`
- `GET /profiles/:userId`
- `GET /landing/:page`
- `POST /landing/organiser-intake`

## Persistence and deployment behavior

- API now supports PostgreSQL-backed persistence via `DATABASE_URL`.
- School index + required Stage 1 tables auto-bootstrap at startup.
- If `DATABASE_URL` is not configured, API falls back to in-memory mode.
- `USE_IN_MEMORY_STORE=true` forces in-memory mode explicitly.

## Mobile shell coverage

- OTP sign-in screen
- Onboarding completion screen (all required fields + terms)
- School search and selection UI
- Theme toggle UI (system/light/dark)
- Notification centre screen after onboarding completion

## Validation

- Automated API tests added with Vitest + Supertest (`apps/api/tests/stage1-api.test.ts`).
- CI now runs typecheck + API tests + API build on each push/PR.
- Azure deploy workflow now runs API tests pre-deploy and health-check post-deploy.

## Notes

- OTP remains in development mode and returns `devOtp` in response.
- ACS OTP delivery, abuse controls, and production-grade auth hardening remain later-stage rollout work.
- Razorpay is currently modeled as an in-app payment intent plus local confirmation flow for Stage 2 product wiring; real gateway verification and webhook-backed reconciliation still need to replace the mock confirmation path before production.
- PostgreSQL-backed Stage 2 persistence is implemented with schema bootstrap and seed data for organisers, events, and updates.
- Automated tests currently exercise the Stage 2 contract through the in-memory repository. Live Postgres migration/bootstrap should still be smoke-tested in an environment with a real `DATABASE_URL`.
