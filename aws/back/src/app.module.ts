//aws\back\src\app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath opcional: si existe lo toma, si no, igual lee process.env
      envFilePath: process.env.NODE_ENV === 'development' ? '.env' : undefined,
    }),
    PrismaModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {
  constructor() {
    console.log('[AppModule] init');
  }
}
