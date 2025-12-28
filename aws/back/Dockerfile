# aws/back/Dockerfile

# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ---------- deps (para cachear npm ci) ----------
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ---------- dev (Windows/local) ----------
FROM deps AS dev
ENV NODE_ENV=development

COPY . .

# Prisma v7: necesitamos DATABASE_URL para que prisma.config.ts pueda resolver env("DATABASE_URL")
# (en dev lo vas a pasar por -e, esto es solo un fallback para build)
ENV DATABASE_URL="mysql://root:root@host.docker.internal:3306/app_db"

RUN echo "[dev] prisma generate..." \
 && npx prisma generate --schema prisma/schema.prisma \
 && echo "[dev] prisma generate OK" \
 && ls -la node_modules/.prisma/client | head -n 40

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---------- build (compilar Nest) ----------
FROM deps AS build
COPY . .

# fallback para que prisma.config.ts no reviente durante el build
ENV DATABASE_URL="mysql://root:root@localhost:3306/app_db"

RUN echo "[build] prisma generate..." \
 && npx prisma generate --schema prisma/schema.prisma \
 && echo "[build] prisma generate OK" \
 && ls -la node_modules/.prisma/client | head -n 40

RUN npm run build

RUN echo "[build] dist listing" \
 && ls -la dist | head -n 200 \
 && echo "[build] main candidates" \
 && (ls -la dist/main* dist/src/main* 2>/dev/null || true)

# FAIL HARD si el entrypoint esperado no existe (evita runtime crash en EC2)
RUN test -f dist/src/main.js

# ---------- prod (EC2) ----------
FROM base AS prod
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

# IMPORTANT: llevar Prisma Client generado al runtime
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

RUN echo "[prod] prisma artifacts present?" \
 && ls -la node_modules/.prisma/client | head -n 40

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
