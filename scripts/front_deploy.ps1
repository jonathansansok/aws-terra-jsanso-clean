# ejecutar como powershell -ExecutionPolicy Bypass -File C:\repos\awsok_clean\scripts\front_deploy.ps1
param(
  [string]$RepoRoot = "C:\repos\awsok_clean",
  [string]$Profile  = "terraform",
  [string]$Region   = "us-east-1",
  [string]$DistId   = "E1P0GX0BA66AYO"
)

$frontPath = Join-Path $RepoRoot "aws\front\web"
Set-Location $frontPath

Write-Host "[front_deploy] build..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

Write-Host "[front_deploy] resolve bucket from cloudfront..."
$s3Domain = aws cloudfront get-distribution-config --id $DistId --profile $Profile --region $Region `
  --query "DistributionConfig.Origins.Items[?Id=='s3-origin'].DomainName | [0]" --output text
$Bucket = $s3Domain -replace '\.s3\..*$', ''

Write-Host "[front_deploy] s3Domain=$s3Domain"
Write-Host "[front_deploy] bucket=$Bucket"

Write-Host "[front_deploy] s3 sync dist/..."
aws s3 sync .\dist "s3://$Bucket" --delete --profile $Profile --region $Region `
  --cache-control "public,max-age=31536000,immutable"
if ($LASTEXITCODE -ne 0) { throw "s3 sync failed" }

Write-Host "[front_deploy] upload index.html no-cache..."
aws s3 cp .\dist\index.html "s3://$Bucket/index.html" --profile $Profile --region $Region `
  --cache-control "no-cache,no-store,must-revalidate" --content-type "text/html; charset=utf-8"
if ($LASTEXITCODE -ne 0) { throw "index.html upload failed" }

Write-Host "[front_deploy] cloudfront invalidation..."
aws cloudfront create-invalidation --distribution-id $DistId --paths "/*" --profile $Profile --region $Region

Write-Host "[front_deploy] DONE"
