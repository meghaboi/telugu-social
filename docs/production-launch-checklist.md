# Production Launch Checklist (Phase: Polish + Deploy)

## 1) Build + Deploy
1. Install dependencies: `npm install`
2. Validate production build: `npm run build`
3. Create a Vercel project and configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy the `main` branch.

## 2) Supabase production setup
1. Create a production Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Confirm `forums` table contains all seeded categories.
4. Create moderator profile rows for initial moderator accounts.

## 3) Manual validation protocol
- Sign up with 2–3 real phone numbers and complete onboarding.
- Verify rate limits:
  - 6th post/day for new users should fail.
  - 21st comment/day for new users should fail.
- Verify moderation flow:
  - Report same post 3 times from different users.
  - Ensure post auto-hides, then approve/remove from `/mod`.
- Verify real-time comments by opening same post on 2 devices.

## 4) Known environment limitations in local CI container
- npm package download may fail due registry access policy.
- Build and lint commands must be re-run in a network-enabled environment before release.
