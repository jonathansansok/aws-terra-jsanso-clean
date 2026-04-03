# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fullstack AWS application: React 19 + Vite frontend, NestJS 11 + Prisma v7 backend, MySQL database, deployed to AWS (S3/CloudFront + EC2 + RDS) via Terraform.

## Commands

### Backend (`aws/back/`)
```bash
npm run start:dev      # Dev server with watch mode (port 3000)
npm run build          # Compile TypeScript via NestJS CLI
npm run lint           # ESLint --fix
npm run test           # Jest unit tests
npm run test:e2e       # E2E tests (jest --config ./test/jest-e2e.json)
npm run test:cov       # Coverage report
npx prisma migrate dev # Run DB migrations
npx prisma studio      # GUI for DB inspection
```

### Frontend (`aws/front/web/`)
```bash
npm run dev            # Vite dev server (port 5173, proxies /api → localhost:3000)
npm run build          # tsc -b && vite build
npm run lint           # ESLint
npm run preview        # Preview production build
```

### Local Database (repo root)
```bash
docker compose -f docker-compose.dev.db.yml up -d   # Start MySQL on port 3307
```

### Deployment
- **Frontend:** `scripts/front_deploy.ps1` — builds, syncs to S3, invalidates CloudFront
- **Backend:** SSH to EC2, then `./scripts/20-ec2-back-run.sh` — Docker rebuild and run

## Architecture

### Dev Environment
```
Vite (:5173) --[/api proxy]--> NestJS (:3000) --> Docker MySQL (:3307)
```

### Production (AWS)
```
CloudFront (HTTPS) --> S3 (static frontend)
                   --> EC2 origin (/api/*) --> NestJS Docker --> RDS MySQL (private subnet)
```
No NAT Gateway (cost optimization). RDS is inaccessible from dev machines directly.

### Backend Structure (`aws/back/src/`)
- `main.ts` — global `/api` prefix, CORS, ValidationPipe, Swagger at `/api/docs`
- `app.module.ts` — aggregates Config, Prisma, Health, Products, Orders modules
- `prisma/` — PrismaService using MariaDB adapter
- `products/`, `orders/`, `health/` — NestJS modules (controller → service → Prisma)

### Frontend Structure (`aws/front/web/src/`)
- `features/products/`, `features/orders/` — each has `api.ts`, components, types, Zod schemas
- `shared/` — `env.ts` (VITE_API_BASE_URL), HTTP client, React Query client, formatters
- `components/` — Shadcn/ui wrappers and layout components
- `app/router.tsx` — React Router 7 routes

### Database Schema (Prisma)
- `Product` — id (CUID), name, price (Decimal 10,2), active, timestamps
- `Order` — id, total, createdAt, items (OrderItem[])
- `OrderItem` — orderId, productId, quantity, unitPrice, lineTotal

## Environment Variables

**Backend** (`.env.development` for dev, `.env` for prod):
```
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root:root@localhost:3307/awsok
```

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=/api    # defaults to /api if unset
```

## Key Conventions

- All API routes are prefixed with `/api`
- Frontend uses React Query for server state; Zod schemas for form validation
- Backend uses class-validator DTOs with the global ValidationPipe
- Prisma migrations are committed; run `prisma migrate dev` after pulling schema changes
- No file should exceed 500 lines; one function/component per file
- Local DB is `app_db` (not `awsok`) — use `--default-character-set=utf8mb4` for inserts with Spanish chars

## Phase 2 Roadmap — ECR + ECS Fargate

The current EC2 approach is Phase 1. Phase 2 migrates to the pattern recruiters expect:

**Target architecture:**
```
ALB (public subnets) → ECS Fargate (private subnets) → RDS MySQL
```

**Implementation order:**
1. `aws/back/Dockerfile` multi-stage already exists — verify it builds cleanly
2. Create ECR repo `project-api`, build/push image tagged by commit SHA
3. Terraform modules: `infra/modules/{ecr,ecs,alb,secrets}`
4. ECS task definition: container port 3000, env from Secrets Manager, `awslogs` driver
5. Prisma migrations as ECS one-off task: `npx prisma migrate deploy` (no open RDS ports)
6. GitHub Actions: `deploy-api.yml` (push → ECR + ECS force-deploy), `deploy-web.yml` (build → S3 + CF invalidation)
7. Secrets Manager replaces `/opt/aws-back/.env` on EC2

**Terraform planned structure:**
```
infra/modules/
  network/        vpc, subnets (2 public + 2 private), igw, nat
  ecr/
  ecs/            cluster, task def, service, autoscaling
  alb/            listener, target group, health check /api/health
  rds/            subnet group, instance, sg
  s3_cloudfront/  bucket, oac, distribution, SPA 404→index.html fallback
  secrets/        Secrets Manager for DATABASE_URL
```

**Security model (Phase 2):**
- `sg-alb`: inbound 80/443 internet → outbound to `sg-ecs`
- `sg-ecs`: inbound from `sg-alb` port 3000 → outbound to `sg-rds`
- `sg-rds`: inbound 3306 from `sg-ecs` only
- Secrets Manager / SSM for all credentials (no `.env` files in prod)
- ECS tasks use least-privilege IAM task roles
- CloudWatch Logs for all container stdout
