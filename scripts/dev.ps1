# Run dev server (works even if npm is not on PATH yet)
$nodeLink = "$env:APPDATA\nvm\nodejs"
if (-not (Test-Path "$nodeLink\npm.cmd")) {
  & "$PSScriptRoot\setup-env.ps1"
}
$env:Path = "$nodeLink;$env:Path"
Set-Location (Join-Path $PSScriptRoot '..')
& "$nodeLink\npm.cmd" run dev
