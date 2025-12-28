#!/usr/bin/env bash
set -euo pipefail

echo "[30-prisma-migrate-ec2] start"
echo "[30-prisma-migrate-ec2] running migrate deploy inside container"

docker exec -it aws-back sh -lc "npx prisma migrate deploy"

echo "[30-prisma-migrate-ec2] done"
