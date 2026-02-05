# telugu.social MVP

This repo now includes the complete MVP core loops:

- Phone OTP auth (India format)
- Username onboarding with uniqueness checks
- Required city + optional age range profile setup
- Protected forum routes
- Feed + create post + post detail + comments
- Reactions, reports, and moderator queue
- Public profile pages + bio editing
- New-user post/comment daily rate limits

## Environment variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Run

```bash
npm install
npm run dev
```

## Notes

- The post detail page refreshes comments every 5s as a lightweight live-update fallback.
- Database schema updates are in `supabase/schema.sql`.
