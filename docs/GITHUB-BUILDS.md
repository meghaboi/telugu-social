# GitHub Builds and Deployment

## 0) CI pipeline

Workflow: `.github/workflows/ci.yml`

Runs on:

- Pull requests to `main`
- Pushes to `main`

Checks:

- `npm ci`
- `npm run typecheck` (all workspaces)
- `npm --workspace @telugu-social/api run test`
- API build (`apps/api`)

## 1) Android build (Expo EAS)

Workflow: `.github/workflows/mobile-android-build.yml`

Required GitHub secret:

- `EXPO_TOKEN`: Expo personal access token from Expo account settings.

How to run:

1. Open GitHub Actions -> `Mobile Android Build`.
2. Click `Run workflow`.
3. Pick profile:
   - `preview`: internal APK
   - `production`: Play Store AAB

Notes:

- Build output URL is printed in workflow logs by EAS.
- App identifier is `com.telugusocial.app`.
- Runtime API URL can be set with `EXPO_PUBLIC_API_BASE_URL` in EAS env if needed.

## 2) API deploy to Azure App Service

Workflow: `.github/workflows/api-deploy-azure.yml`

Required GitHub secrets:

- `AZURE_API_PUBLISH_PROFILE`: publish profile XML from Azure App Service -> Get publish profile.

Deploy behavior:

- Runs API tests before packaging.
- Builds API and creates ZIP artifact.
- ZipDeploy to Azure App Service.
- Runs post-deploy `/health` verification against the public app hostname.

How to run:

1. Add the publish profile secret in GitHub repo settings.
2. Push to `main` (or run workflow manually).

## 3) Required Azure App Settings (API)

In the API App Service configuration:

- `linuxFxVersion=NODE|20-lts` (runtime stack)
- `NODE_ENV=production`
- `DATABASE_URL=<postgres connection string>`
- `DATABASE_SSL=true` (Azure PostgreSQL default)
- `PORT=8080` (optional; App Service usually injects this)
- `WEBSITES_PORT=8080` (optional)

Optional local/dev fallback:

- `USE_IN_MEMORY_STORE=true` to force non-persistent in-memory mode.

Startup command:

- `npm start`

The deployment package starts from `dist/index.js` via `apps/api/package.json`.
