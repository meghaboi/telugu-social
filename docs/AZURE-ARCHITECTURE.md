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
  - Azure API Management (optional early, recommended before scale)
  - Azure App Service (Node.js API) or Azure Container Apps for backend services

- `Identity and auth`
  - Azure Communication Services (OTP SMS delivery)
  - OTP service in backend
  - JWT access/refresh tokens
  - Role-based access control (`user`, `organizer`, `admin`)

- `Data and storage`
  - Azure Database for PostgreSQL Flexible Server
  - Azure Cache for Redis (feed cache, OTP throttling, session helpers)
  - Azure Blob Storage (profile pictures, event photos/videos)

- `Async and realtime`
  - Azure Service Bus (event pipelines, moderation jobs)
  - Azure Functions (background workers, badge issuance, notifications)
  - Azure Web PubSub (host live updates, realtime status)

- `Payments`
  - Payment provider integration through backend (gateway-agnostic abstraction)
  - Secure webhook handlers on backend

- `Observability and ops`
  - Azure Monitor + Application Insights + Log Analytics
  - Key Vault for secrets and connection strings
  - Azure DevOps or GitHub Actions for CI/CD

## Environment model

- `dev`: active feature development
- `staging`: pre-release validation
- `prod`: launch and live operations

Use separate resource groups and isolated secrets per environment.

## Service mapping to feature areas

- Auth/profile/invites: API + PostgreSQL + Redis + ACS
- Event feed and discovery: API + PostgreSQL + Redis
- Host updates and notifications: Service Bus + Functions + Web PubSub
- Event media: Blob Storage + CDN path
- Verified flows/review: API + Dashboard + workflow queues
- Payments/applications: API + provider integration + audit logs

## Security baseline

- All secrets in Key Vault.
- Private networking where possible for database/cache.
- WAF at edge.
- Signed URLs for media upload/download.
- Rate limits for OTP and auth endpoints.
- Auditable admin/organizer actions.

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
