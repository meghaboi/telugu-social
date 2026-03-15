# GitHub Builds and Deployment

## 0) CI pipeline

Workflow: `.github/workflows/ci.yml`

Runs on:

- Pull requests to `main`
- Pushes to `main`

Checks:

- `npm ci`
- `npm run typecheck` (all workspaces)
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

- `AZURE_API_APP_NAME`: your App Service name (example: `telugusocial-dev-api-1304`)
- `AZURE_API_PUBLISH_PROFILE`: publish profile XML from Azure App Service -> Get publish profile

How to run:

1. Add both secrets in GitHub repo settings.
2. Push to `main` (or run workflow manually).
3. Workflow builds `apps/api`, packages production dependencies, and deploys ZIP to App Service.

## 3) Recommended Azure App Settings

In the API App Service configuration:

- `NODE_ENV=production`
- `PORT=8080` (App Service default is fine if not set)
- `WEBSITES_PORT=8080` (optional)

Startup command:

- `npm start`

The deployment package starts from `dist/index.js` via `apps/api/package.json`.
