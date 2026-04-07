import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common'; // 👈 Agregados NestModule, MiddlewareConsumer, RequestMethod
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuariosModule } from './Usuarios/usuarios.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule } from './roles/roles.module';
import { ProductosModule } from './productos/productos.module';
import { CategoriaModule } from './categoria/categoria.module';
import { PasswordResetsModule } from './password-resets/password-resets.module';
import { AuthService } from './password-resets/password-resets.service';
import { StockModule } from './stock/stock.module';
import { MovimientosService } from './movimiento/movimiento.service';
import { MovimientoModule } from './movimiento/movimiento.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerMiddleware } from './auth/middleware/logger/logger.middleware'; // Tu import ya estaba bien
import { join } from 'path';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'gramas_y_suministros',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
    UsuariosModule,
    RolesModule,
    ProductosModule,
    CategoriaModule,
    PasswordResetsModule,
    StockModule,
    MovimientoModule,
    ProveedoresModule,
    AuthModule,
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
// 👈 Implementamos NestModule para poder usar el Middleware
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      // Indicamos que se aplique a todas las rutas (*) y a todos los métodos (GET, POST, etc.)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}