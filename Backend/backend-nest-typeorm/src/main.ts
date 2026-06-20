import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // ✅ AGREGADO
import { join } from 'path'; // ✅ AGREGADO
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule); // ✅ MODIFICADO (agregado <NestExpressApplication>)

  // Configuración CORS más específica y permisiva
  app.enableCors({
    origin: true, // true permite que el origen sea dinámico (cualquier frontend local o externo)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // ✅ AGREGADO: Servir archivos estáticos desde la carpeta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const options = new DocumentBuilder()
    .setTitle('Gramas Y suministros.')
    .setDescription('Mostrando todas las API´s.')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'access-token',
    ) // Añadir autenticación Bearer a Swagger
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('api/docs', app, document, {
    explorer: true,
    swaggerOptions: {
      filter: true,
      showRequestDuration: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en http://localhost:${port}`);
  console.log(`📚 Swagger disponible en http://localhost:${port}/api/docs`);
}
bootstrap();