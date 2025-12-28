#!/usr/bin/env bash
set -euo pipefail

echo "[20-ec2-back-run] start"
echo "[20-ec2-back-run] whoami=$(whoami) pwd=$(pwd)"

# Repo root expected: /home/ubuntu/aws-terra-jsanso
cd "$(dirname "$0")/.."
echo "[20-ec2-back-run] repo_root=$(pwd)"
ls -la | head -n 40

echo "[20-ec2-back-run] cd aws/back"
cd aws/back
echo "[20-ec2-back-run] back_pwd=$(pwd)"
ls -la | head -n 60

echo "[20-ec2-back-run] docker version"
sudo docker version || true
sudo docker info >/dev/null

echo "[20-ec2-back-run] build prod image (target=prod)"
sudo docker build -t aws-back:prod --target prod .

echo "[20-ec2-back-run] ensure env file exists at /opt/aws-back/.env"
if [[ ! -f /opt/aws-back/.env ]]; then
  echo "[20-ec2-back-run] missing /opt/aws-back/.env"
  exit 1
fi

echo "[20-ec2-back-run] env preview (safe keys only)"
sudo grep -nE '^(NODE_ENV|PORT|CORS_ORIGIN|DATABASE_URL)=' /opt/aws-back/.env || true

echo "[20-ec2-back-run] stop old container if exists"
sudo docker rm -f aws-back >/dev/null 2>&1 || true

echo "[20-ec2-back-run] run prod container (env-file)"
sudo docker run -d --name aws-back --restart unless-stopped \
  --env-file /opt/aws-back/.env \
  -p 127.0.0.1:3000:3000 \
  aws-back:prod

echo "[20-ec2-back-run] show effective env inside container"
sudo docker exec -it aws-back sh -lc 'echo "[in-container] NODE_ENV=$NODE_ENV"; echo "[in-container] CORS_ORIGIN=$CORS_ORIGIN"; echo "[in-container] DATABASE_URL=$DATABASE_URL"'

echo "[20-ec2-back-run] logs tail"
sudo docker logs -n 160 aws-back || true

echo "[20-ec2-back-run] done"