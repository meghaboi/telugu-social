# telugu.social - Azure Architecture (Single Platform)

## Goals

- Keep hosting centralized in Azure.
- Support React Native mobile app + web dashboards from one backend platform.
- Maintain clean separation of client apps and shared services.

## Proposed architecture

- `Clients`
  - React Native app (iOS/Android)
  - Web dashboard app (Admin + Organizer)

- `Edge and delivery`
  - Azure Front Door + WAF
  - Azure Static Web Apps or Azure App Service (for dashboard frontend)

- `API layer`
  - Azure App Service (Node.js Stage 1 API)
  - Optional Azure API Management before scale

- `Identity and auth`
  - OTP service in backend (Stage 1 currently dev OTP mode)
  - Session token model for Stage 1

- `Data and storage`
  - Azure Database for PostgreSQL Flexible Server (primary Stage 1 persistence)
  - Azure Cache for Redis (later optimization)
  - Azure Blob Storage (profile pictures/media in later stages)

- `Async and realtime`
  - Azure Service Bus, Functions, and Web PubSub for later stages

- `Observability and ops`
  - Azure Monitor + Application Insights + Log Analytics
  - Key Vault for secrets
  - GitHub Actions for CI/CD

## Environment model

- `dev`: active feature development
- `staging`: pre-release validation
- `prod`: launch and live operations

Use separate resource groups and isolated secrets per environment.

## Stage 1 API persistence model (PostgreSQL)

Current Stage 1 API can auto-bootstrap these tables:

- `schools`
- `users`
- `user_interests`
- `otp_requests`
- `sessions`
- `notifications`

School index seed data is inserted/updated at startup.

## Security baseline

- All secrets in Key Vault.
- Private networking where possible for database/cache.
- WAF at edge.
- Rate limits for OTP/auth endpoints.
- Audit logs for sensitive admin operations in later stages.

## First provisioning targets

- Resource group
- App Service plan + backend API app
- Web app for dashboards
- PostgreSQL flexible server + database
- Blob storage account + container
- Redis cache
- Service Bus namespace
- Key Vault
- Application Insights
