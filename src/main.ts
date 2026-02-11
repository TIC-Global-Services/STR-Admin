import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AuditLogInterceptor } from './audit/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      bodyLimit: 10 * 1024 * 1024,
      trustProxy: true,
    }),
  );

  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  await app.register(import('@fastify/cors'), {
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://str-admin.vercel.app',
    ],
    credentials: true,
  });

  await app.register(import('@fastify/cookie'), {
    secret: process.env.COOKIE_SECRET,
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // app.useGlobalInterceptors(app.get(AuditLogInterceptor));

  await app.listen({
    port: Number(process.env.PORT) || 5000,
    host: '0.0.0.0',
  });
}
bootstrap();
