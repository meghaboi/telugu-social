# telugu.social

Open-access Hyderabad youth community platform with onboarding, identity, and event/community rollout in stages.

## Current implementation

- Stage 1: implemented
- Stage 2: implemented in the app/API shell for local development
  - Pulse feed, event discovery, event detail, application flow, QR ticket confirmation
  - Social graph: user discovery, friend requests, friend list, privacy-aware profiles
  - Minimal landing page API content and organiser intake endpoint
  - Expanded mobile shell for Pulse, Events, Friends, and Inbox views
  - API coverage with automated tests for onboarding, events, payments, social graph, and intake

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
- PostgreSQL bootstrap now seeds Stage 1 schools plus Stage 2 organisers, events, and event updates.

## API endpoints

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

## Testing

- API tests: `npm --workspace @telugu-social/api run test`
- Workspace typecheck: `npm run typecheck`

## Azure-first architecture

See [docs/AZURE-ARCHITECTURE.md](./docs/AZURE-ARCHITECTURE.md) and provisioning script at [infra/azure/provision.ps1](./infra/azure/provision.ps1).

## CI/CD

GitHub build/deploy setup is documented in [docs/GITHUB-BUILDS.md](./docs/GITHUB-BUILDS.md).
