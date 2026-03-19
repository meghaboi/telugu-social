# telugu.social - Rollout Stages (v3)

Aligned to `telugu_social_design_doc_v2.pdf` and `telugu_social_product_scope.pdf`.
Updated March 2026. Replaces v2 plan entirely.

## Product Surfaces in Scope

- User App (iOS/Android, React Native + Expo)
- Web App (Next.js, full user parity)
- Landing Page (public marketing site)
- Event Organiser Dashboard (web)
- Space Admin Panel (web)
- Platform Admin Dashboard (internal web)
- Shared Platform Layer (API, auth, data, moderation, notifications, payments, analytics)

## Key Changes from v2

- Stage 3 expanded from 4 to 6 weeks - anonymous posting trust boundary and moderation controls require more time than originally estimated.
- Social graph (friend requests, privacy-aware profiles) moved from Stage 4 into Stage 2 so it underpins Pulse friend signals and leaderboard from the start.
- Minimal landing page (holding page, privacy, terms, organiser intake form) moved to Stage 2. Full SEO and blog build stays at Stage 7.
- Stage 8 split into two stages - badges, leaderboard, and volunteer in Stage 8, launch hardening and UAT in Stage 9.
- Explicit QA allocation added to each stage exit criteria.
- Realistic total timeline is 34 weeks versus the 29 weeks estimated in v2.

---

## Stage 0 - Architecture and Design System Lock (2 weeks)

Surfaces: all

Scope:
- Freeze v2 information architecture and role model: `end_user`, `organiser`, `space_admin`, `platform_admin`, `finance_admin`.
- Lock monochrome design tokens, typography, spacing, elevation, and component primitives for both mobile and web.
- Finalize shared API contracts for: OTP auth, onboarding, events and applications, spaces and threads, chat and notifications, badges and leaderboard, admin operations.
- Baseline environments and secrets on Azure for `dev`, `staging`, `prod`.
- Document security and audit baseline for all admin surfaces.

Exit criteria:
- Design tokens published and consumed by both mobile and web codebases.
- API schema `v2` approved across all surfaces.
- Security baseline documented and signed off.
- No code written for product features until this stage is closed.

---

## Stage 1 - Open Access Onboarding and Identity (3 weeks)

Surfaces: User App, Web App, Shared Platform Layer

Scope:
- OTP login and signup.
- Open access onboarding with no invite gate.
- Profile setup: name, DOB (must be 14 or older), optional photo, interests (minimum 3), neighbourhood.
- School index search with self-reported school chip - no email verification required at this stage.
- Terms acceptance capture with policy version tracking.
- In-app notification centre foundation.
- Dark mode support from day one - all onboarding screens respond to system preference and manual toggle.

Exit criteria:
- New users complete full onboarding end-to-end on both mobile and web.
- School selection works from the central Hyderabad school index.
- No invite dependency anywhere in the signup path.
- Dark mode renders correctly across all onboarding screens.
- QA sign-off on both iOS and Android onboarding flows.

---

## Stage 2 - Core Discovery: Pulse, Events, and Social Graph (5 weeks)

Surfaces: User App, Web App, Shared Platform Layer, Landing Page (minimal)

Scope:
- Pulse home with finite sections, card limits, and Friends going section.
- Events browse with filters: category, area, date, price.
- Event detail with organiser block, updates feed, friends attending (private), recap placeholder.
- 4-step application flow: review, details form, payment, confirmation with QR ticket.
- Razorpay in-app payment flow with no redirect.
- Event reminders and update notifications.
- Social graph: friend request lifecycle, friend list, privacy-aware profile views.
- Friends going signal on Pulse draws from social graph - only visible to the requesting user.
- Minimal landing page: Home holding page, Privacy Policy, Terms of Service, organiser application intake form. No blog, no SEO optimisation yet.

Note: Social graph is included here because the Friends going section on Pulse, the who is going section on event detail, and the friends leaderboard scope in Stage 8 all depend on it. Building it later would require retrofitting three surfaces.

Exit criteria:
- Users can discover, apply, pay, and receive a QR ticket on both app and web.
- Organiser update posts visible in event detail feed.
- Friend requests send, accept, and reject correctly.
- Profile views respect friendship status and show limited information to non-friends.
- Minimal landing page is live with working organiser intake form.
- QA sign-off on payment flow end-to-end in staging.

---

## Stage 3 - Spaces and Community Moderation (6 weeks)

Surfaces: User App, Web App, Space Admin Panel, Shared Platform Layer

Scope:
- Spaces directory and space detail with four tabs: Threads, Events, Members, About.
- Thread creation and flat replies. Report via long-press.
- Three space join modes: open, coordinator review queue, invite code with expiry.
- Anonymous posting toggle for eligible school spaces.
- Anonymous authorship trust boundary: visible only to the space coordinator when a post has been reported. Never visible as a general browsing view. This must be enforced technically and validated with security tests.
- Space admin panel: members list, threads management (pin, unpin, lock, delete), moderation queue, anonymous log (report-gated), invite link generation, space settings.
- Compose new thread flow with title, body, category chip selector, and anonymous toggle.

Note: Stage 3 is 6 weeks because the anonymous trust boundary is a security-critical feature. A mistake here - accidentally exposing anonymous authorship - is a platform-level trust failure. The extra two weeks versus v2 are for correct implementation, security review, and adversarial testing of the moderation boundary.

Exit criteria:
- School, fan club, and interest spaces run end-to-end with correct moderation controls.
- Anonymous author privacy boundary validated with security tests including adversarial cases.
- Space coordinator can manage members, threads, and reported content fully via the admin panel.
- All three join modes work correctly with correct permission enforcement.
- QA sign-off on all moderation flows.

---

## Stage 4 - Chat and Notifications (4 weeks)

Surfaces: User App, Web App, Shared Platform Layer

Scope:
- Direct messages and event-linked group chats (maximum 50 members).
- Message types: text and images only. No stickers, no reactions.
- Read receipts: single tick sent, double tick read.
- Event-linked group chats auto-created on event attendance confirmation. Organiser is admin.
- Batched group message notifications and DM push notifications.
- Full notification centre: grouped by Today and Earlier, mark as read, navigate to source.
- Notification rules matching v2 product spec - no push for social actions, only actionable or time-sensitive events.

Exit criteria:
- Users communicate via DM and event groups on mobile and web with stable delivery.
- Notification fanout rules match v2 spec and are verified against each notification type.
- Event-linked group chat is created correctly on attendance confirmation.
- QA sign-off on message delivery, read receipts, and notification routing.

---

## Stage 5 - Event Organiser Dashboard (4 weeks)

Surfaces: Event Organiser Dashboard, User App, Web App, Shared Platform Layer

Scope:
- Organiser onboarding and approval handoff from platform admin.
- Event CRUD: draft, upcoming, past states. Custom applicant fields. Media uploads.
- Event-day browser-based QR check-in - no app download required for organiser. Camera activates in browser.
- Check-in data feeds badge issuance and attendance tracking.
- Event updates and recap publishing from dashboard.
- Payments area: payout history, pending balance, bank account details, invoice downloads.
- Organiser analytics: views, conversion rate, attendance rate, area and interest breakdown per event.
- Co-organiser access: invite team members to a shared event.

Exit criteria:
- Verified organiser runs a full paid event lifecycle - create, publish, sell tickets, check in attendees, post recap - without platform team intervention.
- Check-in QR scan correctly triggers badge issuance within 24 hours of event end.
- Payout calculations are correct and match the agreed fee percentage from platform config.
- QA sign-off on full event lifecycle including edge cases: refunds, cancelled events, zero-ticket events.

---

## Stage 6 - Platform Admin and Governance (4 weeks)

Surfaces: Platform Admin Dashboard, Space Admin Panel, Shared Platform Layer

Scope:
- Platform home: live metrics for DAU, MAU, events this week, new sign-ups, revenue today.
- Admin modules: users (search, filter, suspend, ban), organisers (applications, approvals), events (approve, reject, feature on Pulse), schools (index management, coordinator assignment), spaces (member count, flag rate, shutdown), volunteer causes (applications, approvals).
- Global moderation queue with escalation from space admins.
- Platform notifications: segment-targeted and global in-app sends, scheduled or immediate.
- Team RBAC: super admin, ops, support, finance roles with gated access per module.
- Config controls: fee percentages, badge point values, leaderboard reset schedule.
- All sensitive admin actions are audit logged with actor, timestamp, and action type.

Exit criteria:
- Operations team manages trust, payouts, school index, and policy actions fully via admin UI.
- All sensitive actions produce audit log entries and are correctly role-gated.
- RBAC tested adversarially - finance role cannot access moderation tools, support cannot change fee config, etc.
- QA sign-off on all admin modules including permission boundary tests.

---

## Stage 7 - Landing Page, Content, and Public SEO (2 weeks)

Surfaces: Landing Page, Shared Platform Layer

Scope:
- Full public site: Home, About, Events (public verified-events preview), For Organisers, For Schools, Blog, Press, Privacy Policy, Terms of Service, 404.
- Public verified-events preview feed - browsable without login, Apply prompts sign-up.
- Organiser application and school partnership lead capture forms.
- Technical SEO: meta tags, Open Graph, sitemap, full indexability.
- Performance budget: sub-2 second load, Lighthouse score above 90 on core pages.
- Cookie-free analytics via privacy-respecting tool.

Exit criteria:
- All public pages live and indexed.
- Organiser and school intake forms submit correctly and route to platform admin queue.
- Performance budget met on Home, Events, and For Organisers pages.
- Legal pages live, versioned, and linked correctly from app and web.

---

## Stage 8 - Badges, Leaderboard, and Volunteer (3 weeks)

Surfaces: User App, Web App, Organiser Dashboard, Platform Admin Dashboard, Shared Platform Layer

Scope:
- Badge issuance engine: rules per badge type, point ledger, automatic trigger on confirmed check-in.
- Badge collection screen: 3-column grid mobile, 4-column desktop. Detail sheet with name, earn condition, date, points.
- Leaderboard scopes: Friends, My School, City top-50. Monthly reset with all-time totals stored separately. Your rank pinned at bottom. Volunteer points in a separate column.
- Volunteer flow: cause listings on Events tab via Volunteer chip filter. Cause detail with description, requirements, and Earn 30 points. Application flow pre-filled from profile. QR check-in same system as events. 30 points on confirmed attendance.
- Platform admin controls for badge point values and leaderboard reset schedule already built in Stage 6 - this stage connects the live data to those controls.

Exit criteria:
- Badge issuance fires correctly within 24 hours of confirmed event or volunteer check-in.
- Leaderboard scopes compute and display correctly with correct monthly reset behaviour.
- Volunteer flow runs end-to-end including point credit and badge issuance.
- QA sign-off on badge rules, point calculations, and leaderboard accuracy.

---

## Stage 9 - Launch Hardening and UAT (2 weeks)

Surfaces: all

Scope:
- Observability: structured logging, error tracking, uptime monitoring, alerting on all surfaces.
- Rate limiting and abuse controls on auth, messaging, and event application endpoints.
- Rollback playbooks and incident runbooks documented and tested.
- Full UAT pass across all surfaces at 375px mobile and 1280px desktop.
- Staging dress rehearsal: full simulated event lifecycle from user sign-up to organiser payout.
- Production launch checklist signed off by product, engineering, ops, and finance.
- App store submissions: iOS App Store and Google Play.

Exit criteria:
- All critical paths covered by monitoring with alerting configured.
- Rate limits and abuse controls tested under load.
- UAT completed and all blocking issues resolved.
- App store review submissions sent.
- Launch checklist signed off by all four functions.

---

## Timeline Summary

| Stage | Description                              | Duration   | Cumulative |
|-------|------------------------------------------|------------|------------|
| 0     | Architecture and design system lock      | 2 weeks    | 2 weeks    |
| 1     | Onboarding and identity                  | 3 weeks    | 5 weeks    |
| 2     | Pulse, events, social graph              | 5 weeks    | 10 weeks   |
| 3     | Spaces and moderation                    | 6 weeks    | 16 weeks   |
| 4     | Chat and notifications                   | 4 weeks    | 20 weeks   |
| 5     | Organiser dashboard                      | 4 weeks    | 24 weeks   |
| 6     | Platform admin and governance            | 4 weeks    | 28 weeks   |
| 7     | Landing page and SEO                     | 2 weeks    | 30 weeks   |
| 8     | Badges, leaderboard, volunteer           | 3 weeks    | 33 weeks   |
| 9     | Launch hardening and UAT                 | 2 weeks    | 35 weeks   |

Total: approximately 35 weeks from architecture lock to app store submission.

---

## Rollout Sequence (User-facing)

1. Private alpha: Stages 1 and 2 on mobile and web with an internal and invited test cohort.
2. Community beta: Stages 3 and 4 enabled for selected schools and organisers. Minimal landing page live.
3. Organiser beta: Stage 5 dashboard access for verified organisers. First real paid events run.
4. Ops beta: Stage 6 internal dashboard for full operations team. School index and moderation fully operational.
5. Pre-launch: Stage 7 full landing page live, intake forms active, SEO indexed.
6. Public launch: Stages 8 and 9 complete. App store listings live. Full feature set available.

---

## Standing Notes

- This v3 plan replaces v2 entirely. v2 should be treated as pre-revision baseline only.
- Open access onboarding (no email gate) is a v2 architectural decision and is non-negotiable in this plan. School verification is coordinator-managed, not platform-managed.
- Dark mode is built into Stage 1 and maintained across all subsequent stages. It is not a feature added at the end.
- Anonymous posting trust boundary in Stage 3 is a security-critical requirement. It must not be deprioritised or deferred.
- QA is not a separate team handoff. Each stage has exit criteria that include QA sign-off and it is the stage owner's responsibility to meet them before moving on.