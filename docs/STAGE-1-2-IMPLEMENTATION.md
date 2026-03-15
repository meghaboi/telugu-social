# Stage 1 and Stage 2 Implementation

## Scope delivered

### Stage 1 (Identity + Profile)

- Invite-gated OTP onboarding with dev OTP simulation.
- User profile fields:
  - name
  - username (unique)
  - profile picture URL
  - pronouns
  - description
- Invite cap flow (5 invites per user).
- Moderation intake hook (`/moderation/report`).

### Stage 2 (Feed + Event Detail)

- Personalized feed endpoint sorted by friend RSVP signal then event time.
- Event detail endpoint with host update timeline and RSVP summary.
- RSVP intent endpoint (`going`, `interested`, `not_going`).
- Search endpoint with query/type/city filters.

## Notes

- This pass uses in-memory stores for rapid iteration and validation.
- It is intentionally designed so data repositories can be swapped with PostgreSQL/Redis/Service Bus in the next stage.
- OTP is in development mode and returns `devOtp` in response.