# telugu.social

Open-access Hyderabad youth community platform with onboarding, identity, and event/community rollout in stages.

## Current implementation

- Stage 1: implemented (API + mobile shell)
  - OTP login/signup (dev OTP simulation)
  - Open access onboarding (no invite gate)
  - Profile setup with Stage 1 fields: name, DOB (14+), optional photo, interests (min 3), neighbourhood
  - Hyderabad school index search and self-reported school selection
  - Terms acceptance capture with policy version tracking
  - In-app notification centre foundation (list/read/mark-all-read)
  - Dark mode support with system preference + manual override (system/light/dark)

## Monorepo structure

- `apps/api`: Node.js + TypeScript API
- `apps/mobile`: React Native (Expo) app shell for Stage 1 flows

## Product scope

- User app (mobile + web surface through Expo web during Stage 1)
- Event organiser dashboard (later stage)
- Platform admin dashboard (later stage)
- Shared backend for all clients

## UI direction

- Neutral monochrome base with adaptive dark/light theme support.
- Clear hierarchy optimized for onboarding conversion.
- Mobile-first with responsive support via Expo web.

## Delivery stages

See [docs/STAGES.md](./docs/STAGES.md).

## Local development

1. Install dependencies:
   - `npm install`
2. Start API + mobile together:
   - `npm run dev`

Or run separately:

- `npm run dev:api`
- `npm run dev:mobile`

Mobile API base URL behavior:

- App defaults to `https://telugusocial-dev-api-1304.azurewebsites.net`.
- Override explicitly with `EXPO_PUBLIC_API_BASE_URL` only when needed.

## Backend persistence mode

- If `DATABASE_URL` is provided, API uses PostgreSQL (recommended for Azure deployment).
- If `DATABASE_URL` is absent, API falls back to in-memory storage.
- Set `USE_IN_MEMORY_STORE=true` to force in-memory mode.

## Stage 1 API endpoints

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

## Testing

- API tests: `npm --workspace @telugu-social/api run test`
- Workspace typecheck: `npm run typecheck`

## Azure-first architecture

See [docs/AZURE-ARCHITECTURE.md](./docs/AZURE-ARCHITECTURE.md) and provisioning script at [infra/azure/provision.ps1](./infra/azure/provision.ps1).

## CI/CD

GitHub build/deploy setup is documented in [docs/GITHUB-BUILDS.md](./docs/GITHUB-BUILDS.md).
