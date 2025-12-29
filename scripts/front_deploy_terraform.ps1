# EJECUTAR CON powershell -ExecutionPolicy Bypass -File C:\repos\awsok_clean\scripts\front_deploy_terraform.ps1

param(
  [string]$RepoRoot = "C:\repos\awsok_clean",
  [string]$Profile  = "terraform",
  [string]$Region   = "us-east-1",
  [string]$InfraDir = "infra",
  [string]$FrontDir = "aws\front\web"
)

$infraPath = Join-Path $RepoRoot $InfraDir
$frontPath = Join-Path $RepoRoot $FrontDir

function Fail($msg) {
  throw "[front_deploy_terraform] $msg"
}

function Get-TerraformOutputRaw([string]$name) {
  Push-Location $infraPath
  try {
    # Importante: init silencioso para asegurar que lee el state correcto
    terraform init -input=false | Out-Null
    $val = terraform output -raw $name 2>&1

    # Si terraform output devolvió warning/error, lo tratamos como fallo.
    if ($LASTEXITCODE -ne 0) {
      Fail "terraform output -raw $name failed: $val"
    }
    if ($val -match "Warning:\s+No outputs found") {
      Fail "terraform state sin outputs (o state incorrecto). Output text: $val"
    }
    return ($val.Trim())
  } finally {
    Pop-Location
  }
}

Write-Host "[front_deploy_terraform] frontPath=$frontPath"
Write-Host "[front_deploy_terraform] infraPath=$infraPath"

# 1) Build
Set-Location $frontPath
Write-Host "[front_deploy_terraform] build..."
npm run build
if ($LASTEXITCODE -ne 0) { Fail "build failed" }

# 2) Outputs desde Terraform (bucket + cloudfront domain)
Write-Host "[front_deploy_terraform] read terraform outputs..."
$Bucket   = Get-TerraformOutputRaw "s3_bucket_name"
$CfDomain = Get-TerraformOutputRaw "cloudfront_domain"

Write-Host "[front_deploy_terraform] bucket=$Bucket"
Write-Host "[front_deploy_terraform] cfDomain=$CfDomain"

# 3) DistId desde CloudFront domain (derivado del output)
Write-Host "[front_deploy_terraform] resolve distId..."
$DistId = aws cloudfront list-distributions --profile $Profile --region $Region `
  --query "DistributionList.Items[?DomainName=='$CfDomain'].Id | [0]" --output text

if (-not $DistId -or $DistId -eq "None") {
  Fail "No pude resolver DistId por DomainName=$CfDomain (revisar output cloudfront_domain o distribución)."
}

Write-Host "[front_deploy_terraform] distId=$DistId"

# 4) Upload S3
Write-Host "[front_deploy_terraform] s3 sync dist/..."
aws s3 sync .\dist "s3://$Bucket" --delete --profile $Profile --region $Region `
  --cache-control "public,max-age=31536000,immutable"
if ($LASTEXITCODE -ne 0) { Fail "s3 sync failed" }

Write-Host "[front_deploy_terraform] upload index.html no-cache..."
aws s3 cp .\dist\index.html "s3://$Bucket/index.html" --profile $Profile --region $Region `
  --cache-control "no-cache,no-store,must-revalidate" --content-type "text/html; charset=utf-8"
if ($LASTEXITCODE -ne 0) { Fail "index.html upload failed" }

# 5) Invalidation
Write-Host "[front_deploy_terraform] cloudfront invalidation..."
aws cloudfront create-invalidation --distribution-id $DistId --paths "/*" --profile $Profile --region $Region

Write-Host "[front_deploy_terraform] DONE"
