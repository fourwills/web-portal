# Create hostverge-upload.zip from dist/ for cPanel File Manager upload
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root "dist"
$zip = Join-Path $root "hostverge-upload.zip"

if (-not (Test-Path (Join-Path $dist "index.html"))) {
  throw "Run npm run build:hostverge first"
}

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $zip -Force
Write-Host "Created: $zip"
Write-Host "Upload via cPanel File Manager -> portal document root -> Extract"
