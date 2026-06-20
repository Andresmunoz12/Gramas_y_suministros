import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordReset } from './password-resets.entity';
import { usuario } from '../Usuarios/usuarios.entity';
import { AuthService } from './password-resets.service';
import { AuthController } from './password-resets.controller';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([usuario, PasswordReset]),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Port 587 uses STARTTLS
        auth: {
          user: 'gramasysuministros.sas@gmail.com',
          pass: 'ffnxtojmottsdczs', // <--- DEBES REEMPLAZAR ESTO
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      defaults: {
        from: '"Soporte Gramas" <gramasysuministros.sas@gmail.com>',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class PasswordResetsModule {}
