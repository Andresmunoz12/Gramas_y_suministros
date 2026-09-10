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
        port: 587,                    // 👈 CAMBIO: Puerto 587 (STARTTLS)
        secure: false,                // 👈 CAMBIO: false para 587
        auth: {
          user: process.env.MAIL_USER || 'gramasysuministros.sas@gmail.com',
          pass: process.env.MAIL_PASSWORD || 'ffnxtojmottsdczs',
        },
        // 👇 AGREGADO: Forzar IPv4
        family: 4,
        // 👇 AGREGADO: Timeouts más largos
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
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