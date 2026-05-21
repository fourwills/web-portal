# One-time setup: links Node 22 and adds it to your user PATH (no admin required).
$ErrorActionPreference = 'Stop'

$nvmRoot = "$env:APPDATA\nvm"
$nodeVer = "$nvmRoot\v22.22.0"
$nodeLink = "$nvmRoot\nodejs"

if (-not (Test-Path $nodeVer)) {
  Write-Host "Installing Node 22.22.0 via nvm..."
  & "$nvmRoot\nvm.exe" install 22.22.0
}

if (-not (Test-Path $nodeLink)) {
  Write-Host "Creating junction: $nodeLink -> $nodeVer"
  cmd /c "mklink /J `"$nodeLink`" `"$nodeVer`""
}

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$nodeLink*") {
  [Environment]::SetEnvironmentVariable('Path', "$nodeLink;$userPath", 'User')
  Write-Host "Added to user PATH: $nodeLink"
} else {
  Write-Host "Node already on user PATH."
}

$env:Path = "$nodeLink;$env:Path"
Write-Host "node: $(& "$nodeLink\node.exe" --version)"
Write-Host "npm:  $(& "$nodeLink\npm.cmd" --version)"
Write-Host ""
Write-Host "Close and reopen your terminal, then run: npm run dev"
