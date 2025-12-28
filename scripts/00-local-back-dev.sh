#!/usr/bin/env bash
set -euo pipefail

echo "[00-local-back-dev] start"
cd aws/back

echo "[00-local-back-dev] build dev image"
docker build -t aws-back:dev --target dev .

echo "[00-local-back-dev] run dev container"
docker run --rm -p 3000:3000 --name aws-back \
  -e PORT=3000 \
  -e NODE_ENV=development \
  -e CORS_ORIGIN=http://localhost:5173 \
  -e DATABASE_URL="mysql://root@host.docker.internal:3306/app_db" \
  aws-back:dev
