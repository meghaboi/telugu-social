# telugu.social

Invite-only Hyderabad events platform with real-friend connections and IRL participation.

## Current implementation

- Stage 1: implemented (API + mobile shell)
  - OTP request/verify (dev OTP flow)
  - Invite-only onboarding with invite cap (5)
  - Profile setup/edit (name, username, picture, pronouns, description)
  - Moderation report hook
- Stage 2: implemented (API + mobile shell)
  - Personalized feed (city + friend signals + relevance)
  - Event detail with host updates timeline
  - RSVP intent (going/interested/not_going)
  - Search + type filters

## Monorepo structure

- `apps/api`: Node.js + TypeScript API
- `apps/mobile`: React Native (Expo) app shell for Stage 1/2 flows

## Product scope

- Mobile app (React Native, Android + iOS): user experience.
- Web app (browser): admin dashboard + organizer dashboard.
- Single Azure-first backend for all clients.

## Core user profile and auth

- Number-based signup/login (OTP).
- Profile fields:
  - Name
  - Username
  - Profile picture
  - Pronouns
  - Description/bio

## Event platform scope

- Event feed personalized by location, friends, and relevance.
- Event host updates (active announcement timeline per event).
- Amateur event hosting and discovery.
- Verified event submission, review workflow, and approval.
- Verified events with:
  - Applications
  - Payments
  - Ticketing
- Badge-first identity: event participation reflected on profile.
- Invite-only growth model: each user can invite up to 5 users.

## Dashboards

- `Admin Dashboard` (web):
  - User moderation
  - Verified event approvals
  - Platform operations
- `Organizer Dashboard` (web):
  - Event creation and management
  - Applications and ticket operations
  - Host updates and media
- `User Dashboard` (mobile):
  - Feed, profile, events, badges, invites

## UI direction

- Minimal, modern palette: black, white, ash/grey.
- Bold typography and clear hierarchy.
- Mobile-first interaction language.

## Delivery stages

See [docs/STAGES.md](./docs/STAGES.md).

## Local development

1. Install dependencies:
   - `npm install`
2. Start API:
   - `npm run dev:api`
3. Start mobile app (new terminal):
   - `npm run dev:mobile`

Default API URL is `http://localhost:4000` and can be edited in the mobile app login screen.

## Stage 1/2 API endpoints

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `GET /me`
- `PUT /me`
- `GET /invites`
- `POST /invites`
- `POST /moderation/report`
- `GET /feed`
- `GET /events/search`
- `GET /events/:eventId`
- `POST /events/:eventId/rsvp`

## Azure-first architecture

See [docs/AZURE-ARCHITECTURE.md](./docs/AZURE-ARCHITECTURE.md) and provisioning script at [infra/azure/provision.ps1](./infra/azure/provision.ps1).

## CI/CD

GitHub build/deploy setup is documented in [docs/GITHUB-BUILDS.md](./docs/GITHUB-BUILDS.md).
