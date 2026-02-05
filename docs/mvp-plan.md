# MVP plan: telugu.social

## Goal

Prove users will show up and talk daily.

### Success metrics

1. 300–500 users onboarded
2. 30–40 daily posts/comments
3. Repeat usage without notifications

## Feature scope

### 1) Authentication

- Phone number OTP (India-first)
- Unique username
- Required city selection
- Optional age range

### 2) Forums (core)

#### Categories

- Culture
  - Movies & OTT
  - Music & Pop Culture
  - Memes & Internet Culture
- Life
  - College Life
  - Careers & Tech
  - Dating & Relationships
- City Spaces
  - Hyderabad
  - Bangalore
  - Vizag
  - Chennai
  - Pune
  - NRIs

#### Interactions

- Text posts
- Comment threads (1 level deep)
- Reactions: 🔥 😂 👀 💀 ❤️
- Sorting by New / Active
- No algorithmic feed, only chronological with lightweight ranking

### 3) User profile

- Username
- City badge
- 160-character bio
- Joined date
- Public post history

### 4) Moderation & safety

- Report posts/comments
- Manual moderator tooling
- Rate limits for new users
- Auto-hide content after multiple reports

### 5) Design direction

- Dark mode by default
- Clean typography
- Strong spacing
- High contrast
- No heavy gradients or motion

## Delivery phases

### Phase 0 (week 1)

- Database schema + row-level security policies
- OTP auth + onboarding (username, city, age range)
- Seed forum categories

### Phase 1 (week 2)

- Post creation, listing, comments
- New/Active sort options
- Reactions

### Phase 2 (week 3)

- Report flows
- Moderator review queue
- Auto-hide threshold logic

### Phase 3 (week 4)

- Cohort launch in Hyderabad + Bangalore
- Track daily active posting behavior and repeat usage
