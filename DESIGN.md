# telugu.social - Simple Design Doc

## 1) Product summary

`telugu.social` is an invite-only Hyderabad events network focused on trusted friends, real-world participation, and badge-based identity.

## 2) Goals

- Build a high-trust social graph (friends only, no followers).
- Increase IRL event participation.
- Reward participation and volunteering via profile badges.
- Support both grassroots and verified event ecosystems in one app.

## 3) Non-goals (MVP)

- Nationwide launch outside Hyderabad.
- Desktop web parity.
- Creator monetization features beyond verified event ticketing.

## 4) Users

- Urban young professionals and students in Hyderabad.
- Community organizers (amateur and verified).
- Volunteers interested in social impact projects.

## 5) Core user flows

1. User joins via invite code.
2. User builds friend graph from contacts/invites.
3. User browses nearby events and friend attendance.
4. User joins an event; event is added as a profile badge.
5. User joins volunteer drives to earn additional portfolio badges.
6. User creates amateur events or applies for verified organizer status.

## 6) Functional requirements

- Invite-only onboarding with per-user cap of 5 invites.
- Friend-based discovery feed showing friends' upcoming events.
- Badge ledger tied to completed events and volunteer drives.
- Amateur event creation with moderation workflow.
- Verified events module with ticketing, application, fee, and live updates.
- Event media gallery for photos/videos after event completion.

## 7) Design system direction

- Color palette:
  - `#000000` (black)
  - `#FFFFFF` (white)
  - `#B0B0B0` / `#E5E5E5` (ash/grey variants)
- Visual style:
  - Clean, minimal surfaces.
  - Bold typography for hierarchy and identity.
  - High contrast and simple interaction affordances.

## 8) Technical direction

- Framework: React Native.
- Platforms: Android + iOS from one shared codebase.
- Suggested stack:
  - React Native + TypeScript
  - Expo or bare React Native (decision pending)
  - Backend-as-a-service for auth, data, media, and notifications

## 9) High-level data model

- `User`: id, name, city, invite_count_used, created_at
- `Friendship`: user_id, friend_id, status
- `Invite`: code, inviter_id, invitee_id, used_at
- `Event`: id, title, type(amateur|verified|volunteer), city, start_at, status
- `Attendance`: user_id, event_id, role, joined_at
- `Badge`: id, user_id, event_id, badge_type, issued_at
- `Ticket`: id, event_id, user_id, fee, payment_status
- `EventMedia`: id, event_id, uploader_id, media_type, url

## 10) Risks and mitigations

- Trust/safety risk:
  - Mitigation: invite caps, reporting, organizer verification, moderation queue.
- Event quality inconsistency:
  - Mitigation: separate amateur vs verified labeling and review signals.
- Early network sparsity:
  - Mitigation: curated launch cohorts and seeded events.

## 11) MVP milestones

1. App shell, auth, invite-gated onboarding.
2. Friends graph + event feed + event detail.
3. RSVP/attendance + automatic badge issuance.
4. Volunteer drive flow + volunteer badges.
5. Verified event ticketing and event updates.
6. Media upload for completed events.
