//aws\back\src\prisma\prisma.service.ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = process.env.DATABASE_URL;

    console.log('[PrismaService] ctor');
    console.log('[PrismaService] DATABASE_URL raw=', JSON.stringify(url));

    if (!url) {
      console.log('[PrismaService] missing DATABASE_URL');
      throw new Error('DATABASE_URL is required');
    }

    const adapter: PrismaMariaDb = new PrismaMariaDb(url);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    console.log('[PrismaService] ctor ok');
  }

  async onModuleInit() {
    console.log('[PrismaService] connect start');
    await this.$connect();
    console.log('[PrismaService] connect ok');
  }

  async onModuleDestroy() {
    console.log('[PrismaService] disconnect start');
    await this.$disconnect();
    console.log('[PrismaService] disconnect ok');
  }
}
