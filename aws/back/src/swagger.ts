import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AWS Fullstack CRUD API')
  .setDescription('NestJS + Prisma + MySQL | ECS/Fargate-ready')
  .setVersion('1.0.0')
  .addTag('health')
  .addTag('products')
  .addTag('orders')
  .build();
