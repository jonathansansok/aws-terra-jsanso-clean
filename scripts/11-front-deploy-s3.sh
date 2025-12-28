#!/usr/bin/env bash
set -euo pipefail

echo "[front-deploy] start"

AWS_PROFILE="${AWS_PROFILE:-terraform}"
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BUCKET:-awsok-fullstack-web-bucket-6c5dfc13}"
CF_DOMAIN="${CF_DOMAIN:-d2hiu34pyeqif1.cloudfront.net}"

echo "[front-deploy] AWS_PROFILE=$AWS_PROFILE AWS_REGION=$AWS_REGION"
echo "[front-deploy] S3_BUCKET=$S3_BUCKET CF_DOMAIN=$CF_DOMAIN"

export AWS_PROFILE AWS_REGION S3_BUCKET CF_DOMAIN

echo "[front-deploy] cd aws/front/web"
cd aws/front/web

echo "[front-deploy] dist exists?"
ls -la dist | head -n 20

echo "[front-deploy] sync -> s3://$S3_BUCKET"
aws s3 sync dist "s3://$S3_BUCKET" --delete

echo "[front-deploy] resolve CF_DIST_ID"
CF_DIST_ID=$(
  aws cloudfront list-distributions \
    --query "DistributionList.Items[?DomainName=='$CF_DOMAIN'].Id | [0]" \
    --output text
)
echo "[front-deploy] CF_DIST_ID=$CF_DIST_ID"

echo "[front-deploy] invalidate"
aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"

echo "[front-deploy] done"
