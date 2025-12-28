#!/usr/bin/env bash
set -euo pipefail

echo "[front-build] start"

echo "[front-build] cd aws/front/web"
cd aws/front/web

echo "[front-build] node=$(node -v 2>/dev/null || echo 'no-node') npm=$(npm -v 2>/dev/null || echo 'no-npm')"

echo "[front-build] install deps"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "[front-build] build"
npm run build

echo "[front-build] dist summary"
ls -la dist | head -n 20
ls -la dist/assets | head -n 20

echo "[front-build] done"
