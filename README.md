# Fullstack AWS (Vite + NestJS + Prisma v7 + MySQL)

## Architecture (AWS domains only)
- Frontend (SPA): S3 (private) + CloudFront (default AWS domain)
- Backend: EC2 (public subnet) running Dockerized NestJS
- Database: RDS MySQL (private subnets) accessible only from EC2 SG
- No NAT Gateway (cost control)

## Repo Layout
- aws/front/web: Vite React app (created by `npm create vite@latest web ...`)
- aws/back: NestJS API + Prisma v7
- infra: Terraform (VPC + EC2 + RDS + S3 + CloudFront)
- scripts: operational runbooks (dev/prod)

# awsok_clean — Playbook (DEV en Windows + Deploy PROD en AWS)

Este README es un “bloc de notas” operativo: URLs y comandos robot para no romper nada.

---

## URLs

### Producción (AWS)
- Front (CloudFront): https://d2hiu34pyeqif1.cloudfront.net/
- API (CloudFront → EC2 origin): https://d2hiu34pyeqif1.cloudfront.net/api/health
- Swagger (prod): https://d2hiu34pyeqif1.cloudfront.net/api/docs

### Desarrollo (Windows)
- API local: http://localhost:3000/api
- Swagger local: http://localhost:3000/api/docs

---

# MODO DEV (Windows) — Front local + Back local + DB local (Docker)
Objetivo: probar todo en tu PC sin tocar AWS.

## 1) Front (Vite)
```powershell
cd C:\repos\awsok_clean\aws\front\web
npm run dev
2) DB local (MySQL en Docker)
Desde la raíz del repo:

powershell
Copiar código
cd C:\repos\awsok_clean
docker compose -f docker-compose.dev.db.yml up -d
docker ps
Esperar a que awsok-mysql-dev esté healthy.

3) Backend (NestJS) + Prisma (en Windows)
3.1) Prisma (solo si cambió el schema o si es la primera vez)
powershell
Copiar código
cd C:\repos\awsok_clean\aws\back
$env:NODE_ENV="development"

npx prisma generate
npx prisma db push
3.2) Levantar el backend en watch
powershell
Copiar código
cd C:\repos\awsok_clean\aws\back
$env:NODE_ENV="development"

npm run start:dev
Queda:

http://localhost:3000/api

http://localhost:3000/api/docs

4) Bajar DEV
4.1) Bajar DB (Docker)
powershell
Copiar código
cd C:\repos\awsok_clean
docker compose -f docker-compose.dev.db.yml down
4.2) Bajar backend
En la consola del Nest: CTRL + C

DEV — Variables (referencia)
Backend .env.development
Ruta:

aws/back/.env.development

Ejemplo:

env
Copiar código
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root:root@localhost:3307/app_db
Nota:

En dev tu MySQL está expuesto en 3307 (host Windows) → container 3306.

MODO PROD (AWS) — Deploy del Front (S3 + CloudFront)
Importante: el deploy del front se hace SIEMPRE con el script:

scripts\front_deploy.ps1

1) Deploy del Front (script oficial)
powershell
Copiar código
powershell -ExecutionPolicy Bypass -File C:\repos\awsok_clean\scripts\front_deploy.ps1
Qué hace scripts\front_deploy.ps1
npm run build (genera dist/)

Resuelve el bucket desde CloudFront (origin s3-origin)

aws s3 sync dist/ con cache largo para assets

Re-subida de index.html sin cache

Invalidation /* en CloudFront

(El script ya está listo, no hay que hacerlo a mano.)

MODO PROD (AWS) — Deploy del Backend (EC2 + Docker + RDS)
Modelo mental correcto
En tu PC: hacés cambios en el backend / prisma.

Subís al repo: git push.

En EC2: hacés git pull.

En EC2: corrés ./scripts/20-ec2-back-run.sh para rebuild + redeploy del contenedor.

Mirás logs y validás endpoints.

1) SSH a EC2
powershell
Copiar código
ssh -i "C:\Users\Jonathan\Downloads\awsok-key.pem" ubuntu@98.82.218.189
2) Actualizar código en EC2 (git pull) + redeploy
En EC2:

bash
Copiar código
cd /home/ubuntu/aws-terra-jsanso
git pull
chmod +x scripts/*.sh
./scripts/20-ec2-back-run.sh
3) Logs en vivo
bash
Copiar código
sudo docker logs -f --tail 120 aws-back
4) Validación rápida en EC2
bash
Copiar código
sudo docker ps
curl -i http://localhost/api/health
curl -i http://localhost/api/products
Script backend prod (referencia)
Archivo:

scripts/20-ec2-back-run.sh

Contenido (tal cual):

bash
Copiar código
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
Notas de seguridad / no romper AWS
RDS es privado: desde Windows NO conecta (correcto). Solo EC2 dentro del VPC.

En DEV usá MySQL local (Docker) y .env.development.

No mezclar .env (prod) con .env.development (dev).

El deploy del front no toca Terraform state: solo usa AWS CLI + CloudFront config.

Mapa de archivos clave (arquitectura)
Front (Vite)
aws/front/web/vite.config.ts (dev server, proxy, paths)

aws/front/web/src/shared/env.ts (apiBaseUrl)

aws/front/web/src/shared/http.ts (apiFetch + logs)

aws/front/web/src/features/orders/*

Backend (Nest + Prisma)
aws/back/src/main.ts

aws/back/src/app.module.ts

aws/back/src/prisma/prisma.service.ts

aws/back/prisma/schema.prisma

aws/back/prisma.config.ts

aws/back/.env (prod)

aws/back/.env.development (dev)

Infra (Terraform)
infra/main.tf (archivo tocado para ajustes de mapeo CloudFront/EC2/RDS)

infra/variables.tf

infra/outputs.tf

infra/terraform.tfvars

Scripts
scripts/front_deploy.ps1 (deploy front)

scripts/20-ec2-back-run.sh (deploy back en EC2)

perl

---

# Checklist antes de deploy (Front / Back) — “No romper nada”

## A) Front (Vite → S3 → CloudFront)

1) **Actualizar código y dejar limpio**
```powershell
cd C:\repos\awsok_clean
git status
git pull
Verificar que el backend prod está OK (antes de tocar el front)

powershell
Copiar código
curl.exe -i "https://d2hiu34pyeqif1.cloudfront.net/api/health" | Select-Object -First 20
Ejecutar deploy del front (script único)

powershell
Copiar código
powershell -ExecutionPolicy Bypass -File C:\repos\awsok_clean\scripts\front_deploy.ps1
Validar que CloudFront sirva el front

powershell
Copiar código
curl.exe -i "https://d2hiu34pyeqif1.cloudfront.net/" | Select-Object -First 25
Validar API desde el mismo dominio (contrato final)

powershell
Copiar código
curl.exe -i "https://d2hiu34pyeqif1.cloudfront.net/api/products" | Select-Object -First 25
Si ves HTML en /api (mal)

Señal típica: json parse failed o respuesta <!doctype html>

Acción rápida: reintentar invalidation (o volver a correr el script completo)

powershell
Copiar código
$Profile="terraform"
$Region="us-east-1"
$DistId="E1P0GX0BA66AYO"
aws cloudfront create-invalidation --distribution-id $DistId --paths "/*" --profile $Profile --region $Region
Confirmación final

Abrir en Chrome: https://d2hiu34pyeqif1.cloudfront.net/

Abrir Swagger: https://d2hiu34pyeqif1.cloudfront.net/api/docs

B) Backend (Nest/Prisma → Git push → EC2 git pull → Docker rebuild/run)
En Windows: tests mínimos (local DEV)

powershell
Copiar código
cd C:\repos\awsok_clean\aws\back
$env:NODE_ENV="development"
npx prisma generate
npx prisma db push
npm run start:dev
Checks:

http://localhost:3000/api/health

http://localhost:3000/api/docs

Confirmar cambios listos para subir

powershell
Copiar código
cd C:\repos\awsok_clean
git status
Commit + push

powershell
Copiar código
cd C:\repos\awsok_clean
git add -A
git commit -m "chore: update backend"
git push
En EC2: pull + redeploy

bash
Copiar código
cd /home/ubuntu/aws-terra-jsanso
git pull
chmod +x scripts/*.sh
./scripts/20-ec2-back-run.sh
Logs en vivo

bash
Copiar código
sudo docker logs -f --tail 120 aws-back
Verificación local dentro de EC2 (via nginx)

bash
Copiar código
curl -i http://localhost/api/health
curl -i http://localhost/api/products
Verificación pública (CloudFront)

bash
Copiar código
curl -i https://d2hiu34pyeqif1.cloudfront.net/api/health
curl -i https://d2hiu34pyeqif1.cloudfront.net/api/products
Si hay timeouts Prisma / DB

Verificar .env real en EC2 (NO tocar desde Windows):

bash
Copiar código
sudo grep -nE '^(NODE_ENV|PORT|CORS_ORIGIN|DATABASE_URL)=' /opt/aws-back/.env
Verificar que el contenedor levantó con ese env:

bash
Copiar código
sudo docker exec -it aws-back sh -lc 'echo "NODE_ENV=$NODE_ENV"; echo "DATABASE_URL=$DATABASE_URL"'
makefile
Copiar código
::contentReference[oaicite:0]{index=0}






