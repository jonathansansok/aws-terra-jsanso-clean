// aws/back/prisma.config.ts
import * as dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const nodeEnv = process.env.NODE_ENV || 'development';

// ✅ Regla segura:
// - production -> .env (tu AWS actual, NO se rompe)
// - cualquier otra cosa -> .env.development (tu Windows DEV)
const envFile = nodeEnv === 'production' ? '.env' : '.env.development';

// Cargar env file ANTES de usar env('DATABASE_URL')
dotenv.config({ path: envFile });

// Logs bien explícitos (sirven para debug y luego los podés sacar)
console.log('[prisma.config] NODE_ENV=', nodeEnv);
console.log('[prisma.config] envFile=', envFile);
console.log('[prisma.config] DATABASE_URL=', process.env.DATABASE_URL);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
