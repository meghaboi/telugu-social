# telugu.social

Invite-only Hyderabad events platform with real-friend connections and IRL participation.

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

## Azure-first architecture

See [docs/AZURE-ARCHITECTURE.md](./docs/AZURE-ARCHITECTURE.md) and provisioning script at [infra/azure/provision.ps1](./infra/azure/provision.ps1).
