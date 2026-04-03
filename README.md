# Fullstack POS Admin — AWS Portfolio Project

Production-grade fullstack CRUD demonstrating the AWS services most requested for Full Stack roles.
React + NestJS + Prisma + MySQL, deployed on AWS with Terraform IaC.

---

## Current Architecture (Phase 1 — EC2)

```
User → CloudFront (HTTPS) → S3              (React SPA)
                          → EC2 origin       (NestJS Docker)
                               ↓
                            RDS MySQL (private subnet)
```

- **Frontend:** S3 (private) + CloudFront (CDN + HTTPS)
- **Backend:** EC2 (public subnet) running Dockerized NestJS, proxied via nginx
- **Database:** RDS MySQL (private subnet, accessible only from EC2 SG)
- **IaC:** Terraform (VPC + EC2 + RDS + S3 + CloudFront)
- No NAT Gateway (cost control for Phase 1)

## Roadmap — Phase 2 (ECR + ECS Fargate)

Next migration targets the pattern recruiters look for in 2025/2026:

```
User → CloudFront (HTTPS) → S3                       (React SPA)
                          → ALB (public subnets)
                               → ECS Fargate (private subnets)
                                    ↓
                                 RDS MySQL (private subnet)
                                    ↓
                                 CloudWatch Logs
```

**Implementation order:**
1. Multi-stage `Dockerfile` for Nest (already exists at `aws/back/Dockerfile`)
2. ECR repository `project-api` — build/push image tagged by commit SHA
3. Terraform: `infra/modules/ecr/`, `infra/modules/ecs/`, `infra/modules/alb/`
4. ECS Fargate service (private subnets) + ALB (public subnets)
5. Secrets Manager for `DATABASE_URL` (replaces `/opt/aws-back/.env` on EC2)
6. Prisma migrations as ECS one-off task (`npx prisma migrate deploy`) — no open ports to RDS
7. GitHub Actions: push → ECR build/push → `aws ecs update-service --force-new-deployment`
8. Terraform: `infra/modules/s3_cloudfront/` replaces manual S3 config

**Terraform module structure (planned):**
```
infra/
  main.tf
  variables.tf
  outputs.tf
  envs/dev.tfvars
  modules/
    network/        vpc, subnets, igw, nat
    ecr/
    ecs/            cluster, task def, service
    alb/            target group, listener, /health check
    rds/            subnet group, instance, sg
    s3_cloudfront/  bucket, oac, distribution, SPA 404→index.html
    secrets/        Secrets Manager for DATABASE_URL
```

---

## Repo Layout

```
aws/back/         NestJS API + Prisma v7
aws/front/web/    Vite React app
infra/            Terraform (current: VPC + EC2 + RDS + S3 + CloudFront)
scripts/          Operational runbooks (dev + prod)
docker-compose.dev.db.yml   Local MySQL only
```

---

## URLs

| Environment | URL |
|-------------|-----|
| Front (CloudFront) | https://d2hiu34pyeqif1.cloudfront.net/ |
| API health (prod) | https://d2hiu34pyeqif1.cloudfront.net/api/health |
| Swagger (prod) | https://d2hiu34pyeqif1.cloudfront.net/api/docs |
| API local | http://localhost:3000/api |
| Swagger local | http://localhost:3000/api/docs |

---

## Local Development (Windows)

### Requirements
- Node.js 18+
- Docker Desktop

### 1) Start local DB (MySQL in Docker)

```powershell
cd C:\repos\awsok_clean
docker compose -f docker-compose.dev.db.yml up -d
docker ps   # wait for awsok-mysql-dev healthy
```

### 2) Backend (NestJS)

```powershell
cd C:\repos\awsok_clean\aws\back
$env:NODE_ENV="development"
npx prisma generate
npx prisma db push        # only when schema changes
npm run start:dev
```

Endpoints: http://localhost:3000/api — Swagger: http://localhost:3000/api/docs

### 3) Frontend (Vite)

```powershell
cd C:\repos\awsok_clean\aws\front\web
npm run dev
```

App: http://localhost:5173

### 4) Stop DEV

```powershell
# Backend: Ctrl+C in Nest console
cd C:\repos\awsok_clean
docker compose -f docker-compose.dev.db.yml down
```

### Environment variables

`aws/back/.env.development`:
```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root:root@localhost:3307/app_db
```

`aws/front/web/.env.local`:
```
VITE_API_BASE_URL=/api
```

---

## Deploy — Frontend (S3 + CloudFront)

One command from Windows:

```powershell
powershell -ExecutionPolicy Bypass -File C:\repos\awsok_clean\scripts\front_deploy.ps1
```

What it does: `npm run build` → S3 sync (long cache for assets, no-cache for index.html) → CloudFront invalidation `/*`

**Validate:**
```powershell
curl.exe -i "https://d2hiu34pyeqif1.cloudfront.net/" | Select-Object -First 25
curl.exe -i "https://d2hiu34pyeqif1.cloudfront.net/api/health" | Select-Object -First 20
```

---

## Deploy — Backend (EC2 + Docker + RDS)

Flow: local change → `git push` → SSH to EC2 → `git pull` → rebuild Docker.

### 1) SSH to EC2

```powershell
ssh -i "C:\Users\Jonathan\Downloads\awsok-key.pem" ubuntu@98.82.218.189
```

### 2) Pull + redeploy

```bash
cd /home/ubuntu/aws-terra-jsanso
git pull
chmod +x scripts/*.sh
./scripts/20-ec2-back-run.sh
```

### 3) Monitor

```bash
sudo docker logs -f --tail 120 aws-back
curl -i http://localhost/api/health
curl -i http://localhost/api/products
```

### 4) Debug env / DB connection

```bash
sudo grep -nE '^(NODE_ENV|PORT|CORS_ORIGIN|DATABASE_URL)=' /opt/aws-back/.env
sudo docker exec -it aws-back sh -lc 'echo "NODE_ENV=$NODE_ENV"; echo "DATABASE_URL=$DATABASE_URL"'
```

---

## Pre-deploy Checklist

### Frontend
- [ ] `git pull` latest on main
- [ ] Verify backend is healthy: `curl.exe https://d2hiu34pyeqif1.cloudfront.net/api/health`
- [ ] Run `front_deploy.ps1`
- [ ] Verify CloudFront serves updated app

### Backend
- [ ] Test locally (DEV) before pushing
- [ ] `git push origin main`
- [ ] SSH → `git pull` → `./scripts/20-ec2-back-run.sh`
- [ ] Check logs, verify `/api/health` and `/api/products`

**Never mix `.env` (prod) with `.env.development` (dev). RDS is private — only EC2 can reach it.**

---

## NGINX config reference (EC2 — do not modify)

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3000;
  add_header X-AWSOK-Proxy "nginx->nest" always;
}
```

---

## Key file map

| Area | Files |
|------|-------|
| Frontend entry | `aws/front/web/vite.config.ts`, `src/shared/env.ts`, `src/shared/http.ts` |
| Backend entry | `aws/back/src/main.ts`, `src/app.module.ts` |
| Prisma | `aws/back/prisma/schema.prisma`, `aws/back/prisma.config.ts` |
| Infra | `infra/main.tf`, `infra/variables.tf`, `infra/outputs.tf`, `infra/terraform.tfvars` |
| Deploy scripts | `scripts/front_deploy.ps1`, `scripts/20-ec2-back-run.sh` |
