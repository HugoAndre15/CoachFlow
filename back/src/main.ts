import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Désactiver le body parser par défaut (limite 100kb)
  });

  // Body parser avec limite augmentée (pour les logos base64)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Configuration CORS pour permettre les requêtes depuis le frontend
  app.enableCors({
    origin: process.env.CORS_ORIGIN ||'http://localhost:3000', // URL du frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

   app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    transform: true,           // Active class-transformer (convertit les query params string → number)
    whitelist: true,           // Supprime les propriétés non décorées
    forbidNonWhitelisted: false, // Ne bloque pas les propriétés inconnues (souplesse)
    transformOptions: {
      enableImplicitConversion: true, // Conversion automatique des types
    },
  }));


  // ==================== SWAGGER (DEV UNIQUEMENT) ====================
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MatchFlow API')
      .setDescription('API de gestion de matchs, équipes, joueurs et clubs de football')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez votre token JWT',
        },
        'JWT-auth', // Nom de référence utilisé par @ApiBearerAuth('JWT-auth')
      )
      .addTag('Auth', 'Inscription et connexion')
      .addTag('Users', 'Gestion des utilisateurs')
      .addTag('Clubs', 'Gestion des clubs')
      .addTag('Teams', 'Gestion des équipes')
      .addTag('Players', 'Gestion des joueurs')
      .addTag('Matches', 'Gestion des matchs')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    
    console.log('📖 Swagger UI disponible à http://localhost:' + (process.env.PORT ?? 3001) + '/api');
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();