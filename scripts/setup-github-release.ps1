#requires -Version 5.1
<#
.SYNOPSIS
  Publishes EnglishTok to GitHub and triggers the signed APK release workflow.

.DESCRIPTION
  - Logs in to GitHub CLI if needed (interactive, one time).
  - Creates a PUBLIC repository (required so the installed app can read releases).
  - Pushes the current main branch.
  - Uploads the four Android signing secrets from android/keystore.properties.
  - Pushes a v<version> tag, which starts .github/workflows/android-release.yml.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/setup-github-release.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/setup-github-release.ps1 -RepoName my-englishtok
#>
param(
  [string]$RepoName = "englishtok",
  [string]$Version = "",
  [switch]$SkipTag
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Fail([string]$message) {
  Write-Host ""
  Write-Host "ERROR: $message" -ForegroundColor Red
  exit 1
}

# 0. Required files
$keystore = Join-Path $root "android/english-tok-release.keystore"
$propsFile = Join-Path $root "android/keystore.properties"
if (-not (Test-Path $keystore)) { Fail "Missing android/english-tok-release.keystore. Restore your signing key first." }
if (-not (Test-Path $propsFile)) { Fail "Missing android/keystore.properties. Restore your signing credentials first." }

# 1. GitHub CLI login
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "GitHub CLI is not logged in. A browser window will open." -ForegroundColor Yellow
  Write-Host "Choose: GitHub.com -> HTTPS -> Login with a web browser." -ForegroundColor Yellow
  gh auth login --hostname github.com --git-protocol https --web
  if ($LASTEXITCODE -ne 0) { Fail "GitHub login did not complete." }
}

$login = (gh api user --jq .login).Trim()
if (-not $login) { Fail "Could not read the GitHub username." }
if ($RepoName -match "/") { $repo = $RepoName } else { $repo = "$login/$RepoName" }
Write-Host "Repository: $repo" -ForegroundColor Cyan

# 2. Version and repository
if (-not $Version) {
  $Version = (Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version
}
if ($Version -notmatch '^\d+\.\d+\.\d+$') { Fail "Invalid version '$Version'. Use a stable semantic version such as 1.0.0." }

gh repo view $repo *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating the public repository and pushing main..." -ForegroundColor Cyan
  gh repo create $repo --public --source . --remote origin --push --description "EnglishTok - Arabic-first English learning app"
  if ($LASTEXITCODE -ne 0) { Fail "Could not create or push the repository." }
} else {
  Write-Host "Repository already exists; ensuring origin and pushing main..." -ForegroundColor Cyan
  $origin = (git remote get-url origin 2>$null)
  if (-not $origin) { git remote add origin "https://github.com/$repo.git" }
  git push -u origin main
  if ($LASTEXITCODE -ne 0) { Fail "Could not push main." }
}

# 3. Signing secrets
Write-Host "Uploading Android signing secrets..." -ForegroundColor Cyan
$props = @{}
Get-Content $propsFile | Where-Object { $_ -and -not $_.TrimStart().StartsWith('#') } | ForEach-Object {
  $index = $_.IndexOf('=')
  if ($index -gt 0) { $props[$_.Substring(0, $index).Trim()] = $_.Substring($index + 1).Trim() }
}
foreach ($key in @('storePassword', 'keyAlias', 'keyPassword')) {
  if (-not $props[$key]) { Fail "android/keystore.properties is missing '$key'." }
}
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($keystore))
gh secret set ANDROID_KEYSTORE_BASE64 --body $base64
if ($LASTEXITCODE -ne 0) { Fail "Could not upload ANDROID_KEYSTORE_BASE64." }
gh secret set ANDROID_KEYSTORE_PASSWORD --body $props['storePassword']
gh secret set ANDROID_KEY_ALIAS --body $props['keyAlias']
gh secret set ANDROID_KEY_PASSWORD --body $props['keyPassword']
if ($LASTEXITCODE -ne 0) { Fail "Could not upload the remaining signing secrets." }

# 4. Release tag -> starts the APK workflow
if (-not $SkipTag) {
  $tag = "v$Version"
  git rev-parse "$tag" *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $tag already exists locally; pushing it..." -ForegroundColor Yellow
  } else {
    git tag $tag
  }
  git push origin $tag
  if ($LASTEXITCODE -ne 0) { Fail "Could not push tag $tag." }
  Write-Host ""
  Write-Host "Release tag $tag pushed. GitHub Actions is now building the signed APK." -ForegroundColor Green
  Write-Host "Watch it with:  gh run watch" -ForegroundColor Green
  Write-Host "Release page:  https://github.com/$repo/releases/tag/$tag" -ForegroundColor Green
}

Write-Host ""
Write-Host "Repository:  https://github.com/$repo" -ForegroundColor Cyan
Write-Host "Important: keep the keystore and its passwords backed up. Losing them prevents future updates." -ForegroundColor Yellow
