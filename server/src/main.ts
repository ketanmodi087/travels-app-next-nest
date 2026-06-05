import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import dns from 'node:dns';
import { AppModule } from './app.module';

async function bootstrap() {
  // Prefer IPv4 first to avoid IPv6 SMTP routing issues on some hosts.
  dns.setDefaultResultOrder('ipv4first');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()) ?? true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
