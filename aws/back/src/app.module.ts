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
      //este era para aws sin dev windows envFilePath: process.env.NODE_ENV === 'development' ? '.env' : undefined,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
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
    console.log('[Config] NODE_ENV=', process.env.NODE_ENV);
    console.log('[Config] envFilePath=', [`.env.${process.env.NODE_ENV || 'development'}`, '.env']);
  }
}
