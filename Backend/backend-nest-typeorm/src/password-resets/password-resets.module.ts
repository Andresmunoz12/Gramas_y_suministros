import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PasswordReset } from './password-resets.entity';
import { usuario } from '../Usuarios/usuarios.entity';

import { AuthService } from './password-resets.service';
import { AuthController } from './password-resets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      usuario,
      PasswordReset,
    ]),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
  ],
})
export class PasswordResetsModule {}