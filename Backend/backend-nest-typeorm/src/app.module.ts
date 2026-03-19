import { Module } from '@nestjs/common';
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
import { join } from 'path';

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
  ],
})
export class AppModule { }
