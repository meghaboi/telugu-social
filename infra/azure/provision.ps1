param(
  [Parameter(Mandatory = $true)][string]$SubscriptionId,
  [Parameter(Mandatory = $false)][string]$Location = "centralindia",
  [Parameter(Mandatory = $false)][string]$Environment = "dev",
  [Parameter(Mandatory = $false)][string]$Prefix = "telugusocial",
  [Parameter(Mandatory = $false)][string]$UniqueSuffix = ""
)

$ErrorActionPreference = "Stop"

function Require-Cli {
  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI (az) is not installed or not in PATH."
  }
}

function Ensure-Login {
  az account show 1>$null 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Azure login required. Opening login..."
    az login | Out-Null
  }
}

Require-Cli
Ensure-Login

az account set --subscription $SubscriptionId

if ([string]::IsNullOrWhiteSpace($UniqueSuffix)) {
  $UniqueSuffix = Get-Random -Minimum 1000 -Maximum 9999
}

$rg = "$Prefix-$Environment-rg"
$storage = ($Prefix + $Environment + "st" + $UniqueSuffix).ToLower()
$plan = "$Prefix-$Environment-plan"
$apiApp = "$Prefix-$Environment-api-$UniqueSuffix"
$dashApp = "$Prefix-$Environment-dashboard-$UniqueSuffix"
$postgres = "$Prefix-$Environment-pg-$UniqueSuffix"
$redis = "$Prefix-$Environment-redis"
$bus = "$Prefix-$Environment-sb-$UniqueSuffix"
$kv = "$Prefix-$Environment-kv"
$appi = "$Prefix-$Environment-appi"

# Ensure global uniqueness and length constraints.
$storage = $storage.Substring(0, [Math]::Min($storage.Length, 24))
$kv = $kv.Substring(0, [Math]::Min($kv.Length, 24))

Write-Host "Creating resource group: $rg"
az group create --name $rg --location $Location | Out-Null

Write-Host "Creating App Service plan and apps"
az appservice plan create --name $plan --resource-group $rg --sku B1 --is-linux | Out-Null
az webapp create --resource-group $rg --plan $plan --name $apiApp --runtime "NODE:20-lts" | Out-Null
az webapp create --resource-group $rg --plan $plan --name $dashApp --runtime "NODE:20-lts" | Out-Null

Write-Host "Creating storage account + media container"
az storage account create --name $storage --resource-group $rg --location $Location --sku Standard_LRS | Out-Null
az storage container create --name media --account-name $storage --auth-mode login | Out-Null

Write-Host "Creating Key Vault"
az keyvault create --name $kv --resource-group $rg --location $Location | Out-Null

Write-Host "Creating App Insights"
az monitor app-insights component create --app $appi --resource-group $rg --location $Location --application-type web | Out-Null

Write-Host "Creating Service Bus namespace"
az servicebus namespace create --name $bus --resource-group $rg --location $Location --sku Standard | Out-Null

Write-Host "Creating Redis cache"
az redis create --name $redis --resource-group $rg --location $Location --sku Basic --vm-size c0 | Out-Null

Write-Host "Creating PostgreSQL flexible server"
$pgUser = "tsadmin"
$pgPassword = [Guid]::NewGuid().ToString("N") + "!"
az postgres flexible-server create `
  --name $postgres `
  --resource-group $rg `
  --location $Location `
  --admin-user $pgUser `
  --admin-password $pgPassword `
  --sku-name Standard_B1ms `
  --tier Burstable `
  --storage-size 32 `
  --version 15 `
  --yes | Out-Null

Write-Host "Saving generated DB password in Key Vault"
try {
  az keyvault secret set --vault-name $kv --name "postgres-admin-password" --value $pgPassword | Out-Null
}
catch {
  Write-Warning "Could not save DB password to Key Vault. Grant 'Key Vault Secrets Officer' or set it manually."
}

Write-Host ""
Write-Host "Provisioning complete."
Write-Host "Resource Group: $rg"
Write-Host "API App:        $apiApp"
Write-Host "Dashboard App:  $dashApp"
Write-Host "PostgreSQL:     $postgres"
Write-Host "Storage:        $storage"
Write-Host "Redis:          $redis"
Write-Host "Service Bus:    $bus"
Write-Host "Key Vault:      $kv"
Write-Host "App Insights:   $appi"
