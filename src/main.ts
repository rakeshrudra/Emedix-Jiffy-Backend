import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // cookie parser to save cookie in browser
  app.use(cookieParser());

  // CORS setup
  const allowedOrigins = [
    process.env.ADMIN_DASHBOARD_URL, 'http://localhost:5174',
    process.env.VITALITY_URL, 'http://localhost:5173',
  ].filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Emedix Jiffy API')
    .setDescription('API documentation for the Emedix Jiffy backend')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .addBearerAuth()
    .addTag('App')
    .addTag('Admin Auth')
    .addTag('Authentication')
    .addTag('emedix-webhook')
    .addTag('Admin Products')
    .addTag('Products')
    .addTag('Super Admin Orders')
    .addTag('Admin Orders')
    .addTag('Orders')
    .addTag('Super Admin Stores')
    .addTag('Admin Stores')
    .addTag('Stores')
    .addTag('Cart')
    .addTag('Addresses')
    .addTag('Maps')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT);
}
bootstrap();
