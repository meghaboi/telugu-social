# telugu.social - Development Stages

## Stage 0 - Foundation and Product Definition

- Finalize IA, user flows, and dashboard boundaries.
- Lock UI tokens (color, typography, spacing, components).
- Create data model and API contracts.
- Set Azure environments: `dev`, `staging`, `prod`.
- Define security baseline and role model (`user`, `organizer`, `admin`).

## Stage 1 - Identity and Profile (Mobile + Backend)

- Number OTP authentication.
- Profile setup/edit:
  - Name
  - Username (unique)
  - Picture
  - Pronouns
  - Description
- Invite-only onboarding and invite cap.
- Basic abuse controls and moderation hooks.

Exit criteria:
- Users can sign up, complete profile, and invite others.

## Stage 2 - Event Feed and Event Detail (Mobile)

- Personalized feed (friends + nearby + relevance).
- Event detail page with:
  - Description
  - Time/location
  - Host updates timeline
  - RSVP intent
- Basic search and filters.

Exit criteria:
- Users can browse, follow updates, and mark participation intent.

## Stage 3 - Hosting and Dashboards (Web + Backend)

- Organizer dashboard:
  - Create amateur events
  - Update events
  - Manage attendees/media
- Admin dashboard:
  - Review queues
  - User/event moderation
  - Verification decisions

Exit criteria:
- Organizers and admins can fully operate through web interfaces.

## Stage 4 - Verified Events, Applications, Payments

- Verified event submission flow.
- Review and approval pipeline.
- Application workflow for restricted events.
- Payment flow and ticket issuance.
- Event-level operational updates.

Exit criteria:
- Verified events can run end-to-end from submission to paid attendance.

## Stage 5 - Badges, Portfolio, Volunteer System

- Automatic event badges on profile.
- Volunteer drives and volunteer badges.
- Portfolio timeline with proof artifacts.
- Friend visibility controls for badges and attendance.

Exit criteria:
- Badge identity and volunteer portfolio are fully active.

## Stage 6 - Scale, Reliability, and Launch Readiness

- Observability, tracing, and error budgets.
- Hardening: rate limits, abuse prevention, fraud controls.
- Performance optimization for feed and event media.
- CI/CD gates and rollback playbooks.

Exit criteria:
- Production launch checklist complete for Hyderabad rollout.
