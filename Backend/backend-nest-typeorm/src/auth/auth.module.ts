// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsuariosModule } from '../Usuarios/usuarios.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { usuario } from '../Usuarios/usuarios.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([usuario]), // ✅ Agregar esto
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_123',
      signOptions: { expiresIn: '7d' },
    }),
    UsuariosModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}