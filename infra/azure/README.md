# Azure Provisioning

This folder contains a baseline provisioning script for the telugu.social platform.

## Prerequisites

- Azure CLI installed (`az --version`)
- Logged in (`az login`)
- Subscription with permissions to create resources

## Usage

```powershell
./infra/azure/provision.ps1 `
  -SubscriptionId "<your-subscription-id>" `
  -Location "centralindia" `
  -Environment "dev" `
  -Prefix "telugusocial" `
  -UniqueSuffix "1304"
```

## Notes

- This is a starter provisioning flow for development.
- `UniqueSuffix` helps avoid global-name collisions for web apps, PostgreSQL, and Service Bus.
- If Key Vault RBAC blocks secret writes, assign yourself `Key Vault Secrets Officer` on the vault and re-run secret set.
- For staging/prod, migrate to IaC templates (Bicep/Terraform) with stricter networking/security controls.
