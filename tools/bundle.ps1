#> powershell -ExecutionPolicy Bypass -File .\tools\bundle.ps1
param(
  [string]$OutFile = "bundle_debug.md"
)

# root = carpeta del repo (1 nivel arriba de /tools)
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

# Si OutFile es relativo, lo anclamos al repoRoot
if (-not [System.IO.Path]::IsPathRooted($OutFile)) {
  $OutFile = Join-Path $root $OutFile
}

$raw = Get-Clipboard -Raw

Write-Host "[bundle] clipboard len:" $raw.Length
Write-Host "[bundle] scriptRoot:" $PSScriptRoot
Write-Host "[bundle] repoRoot:" $root
Write-Host "[bundle] out(full):" $OutFile

$paths = $raw -split "`r?`n" |
  ForEach-Object { $_.Trim().Trim('"') } |
  Where-Object { $_ -ne "" }

Write-Host "[bundle] paths count:" $paths.Count
$paths | ForEach-Object { Write-Host "[bundle] path:" $_ }

("## DEBUG BUNDLE - " + (Get-Date -Format s) + "`n") | Out-File -Encoding utf8 $OutFile

foreach ($p in $paths) {
  $candidate = $p

  if (-not (Test-Path $candidate)) {
    $candidate = Join-Path $root $p
  }

  if (Test-Path $candidate) {
    $full = (Resolve-Path $candidate).Path
    $rel = $full.Replace($root, "").TrimStart("\","/")

    $body = (Get-Content $full -Raw)
    $body = $body.Trim()

    "`n---`n// $rel`n" | Out-File -Append -Encoding utf8 $OutFile
    $body | Out-File -Append -Encoding utf8 $OutFile
    "`n" | Out-File -Append -Encoding utf8 $OutFile

    Write-Host "[bundle] OK:" $rel
  } else {
    "`n---`n// MISSING: $p`n" | Out-File -Append -Encoding utf8 $OutFile
    Write-Host "[bundle] MISSING:" $p
  }
}

$content = Get-Content $OutFile -Raw
$content | Set-Clipboard
Write-Host "[bundle] COPIED -> clipboard"
Write-Host "[bundle] DONE ->" $OutFile
