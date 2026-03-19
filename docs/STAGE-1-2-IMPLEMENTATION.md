# Stage 1 Implementation (Open Access Onboarding and Identity)

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
