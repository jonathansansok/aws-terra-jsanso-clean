//aws\back\src\main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './swagger';

async function bootstrap() {
  console.log('[bootstrap] start');

  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  const port = Number(process.env.PORT || 3000);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  console.log('[bootstrap] env', {
    port,
    corsOrigin,
    nodeEnv: process.env.NODE_ENV,
  });

  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, doc);

  await app.listen(port, '0.0.0.0');
  console.log(`[bootstrap] listening http://0.0.0.0:${port}`);
  console.log(`[bootstrap] swagger    http://0.0.0.0:${port}/docs`);
}

bootstrap().catch((err) => {
  console.log('[bootstrap] fatal', err);
  process.exit(1);
});
