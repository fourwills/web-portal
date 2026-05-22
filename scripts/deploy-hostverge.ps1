# Upload dist/ to Hostverge via FTP (cPanel)
# Usage: set FTP_USER and FTP_PASS, then run from client-portal folder
param(
  [string]$FtpHost = "ftp.hostverge.com",
  [string]$RemoteDir = ""
)

$ErrorActionPreference = "Stop"
$dist = Join-Path $PSScriptRoot "..\dist"
if (-not (Test-Path (Join-Path $dist "index.html"))) {
  throw "dist/index.html missing. Run: npm run build:hostverge"
}

$user = $env:FTP_USER
$pass = $env:FTP_PASS
if (-not $user -or -not $pass) {
  throw "Set FTP_USER and FTP_PASS environment variables"
}

function Get-FtpListing([string]$path) {
  $uri = "ftp://${FtpHost}/$($path.TrimStart('/'))"
  $req = [System.Net.FtpWebRequest]::Create($uri)
  $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
  $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
  $req.UsePassive = $true
  $req.EnableSsl = $false
  $res = $req.GetResponse()
  $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
  $text = $reader.ReadToEnd()
  $reader.Close()
  $res.Close()
  return $text -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

function New-FtpDirectory([string]$path) {
  $uri = "ftp://${FtpHost}/$($path.TrimStart('/'))"
  try {
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
    $req.UsePassive = $true
    $res = $req.GetResponse()
    $res.Close()
  } catch {
    # already exists
  }
}

function Send-FtpFile([string]$localPath, [string]$remotePath) {
  $uri = "ftp://${FtpHost}/$($remotePath.TrimStart('/'))"
  $req = [System.Net.FtpWebRequest]::Create($uri)
  $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
  $req.Credentials = New-Object System.Net.NetworkCredential($user, $pass)
  $req.UseBinary = $true
  $req.UsePassive = $true
  $bytes = [System.IO.File]::ReadAllBytes($localPath)
  $req.ContentLength = $bytes.Length
  $stream = $req.GetRequestStream()
  $stream.Write($bytes, 0, $bytes.Length)
  $stream.Close()
  $res = $req.GetResponse()
  $res.Close()
  Write-Host "Uploaded $remotePath"
}

# Resolve remote document root for portal subdomain
$candidates = @(
  "portal.thevoiptalk.com",
  "public_html/portal.thevoiptalk.com",
  "public_html/portal",
  "portal",
  "public_html"
)
if ($RemoteDir) { $candidates = @($RemoteDir) }

$target = $null
foreach ($dir in $candidates) {
  try {
    $null = Get-FtpListing $dir
    $target = $dir
    Write-Host "Using FTP directory: $target"
    break
  } catch {
    Write-Host "Skip $dir : $($_.Exception.Message)"
  }
}
if (-not $target) {
  Write-Host "Root listing:"
  Get-FtpListing "" | ForEach-Object { Write-Host "  $_" }
  throw "Could not find portal document root. Pass -RemoteDir manually."
}

New-FtpDirectory "$target/assets"
$files = Get-ChildItem $dist -Recurse -File
foreach ($f in $files) {
  $rel = $f.FullName.Substring($dist.Length + 1).Replace("\", "/")
  Send-FtpFile $f.FullName "$target/$rel"
}
Write-Host "Deploy complete -> https://portal.thevoiptalk.com"
