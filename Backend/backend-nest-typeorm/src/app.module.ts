// src/app.module.ts
import * as dotenv from 'dotenv';
dotenv.config();

import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './Usuarios/usuarios.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesModule } from './reportes/reportes.module';
import { RolesModule } from './roles/roles.module';
import { ProductosModule } from './productos/productos.module';
import { CategoriaModule } from './categoria/categoria.module';
import { PasswordResetsModule } from './password-resets/password-resets.module';
import { StockModule } from './stock/stock.module';
import { MovimientoModule } from './movimiento/movimiento.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerMiddleware } from './auth/middleware/logger/logger.middleware';
import { join } from 'path';
import { RolesGuard } from './auth/guards/roles.guard';
import * as fs from 'fs';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      // Usar la URL directamente desde las variables de entorno
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Crear tablas automáticamente
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    UsuariosModule,
    RolesModule,
    ProductosModule,
    CategoriaModule,
    PasswordResetsModule,
    CotizacionesModule,
    StockModule,
    MovimientoModule,
    ProveedoresModule,
    AuthModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}