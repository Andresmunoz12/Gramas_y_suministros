import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';
import { PasswordReset } from './password-resets.entity';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(usuario)
    private userRepo: Repository<usuario>,
    @InjectRepository(PasswordReset)
    private resetRepo: Repository<PasswordReset>,
    private readonly MailerService: MailerService,
  ) {}

  async solicitarRecuperacion(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('El correo no está registrado');

    const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardamos el código en la tabla
    const reset = this.resetRepo.create({
      email: email,
      codigo: nuevoCodigo,
      usado: 0,
    });

    await this.resetRepo.save(reset);

    // Enviamos el correo con el código
    await this.MailerService.sendMail({
      to: email,
      subject: 'Tu código de recuperación - Gramas y Suministros',
      html: `
        <div style="margin: 0; padding: 0; background-color: #f9f9f9; padding-top: 20px; padding-bottom: 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #e0e0e0;">
            
            <tr>
              <td style="background-color: #7cd36d; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  Gramas y Suministros
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 20px; text-align: center;">
                <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 22px;">Verificación de Identidad</h2>
                <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 auto; max-width: 450px;">
                  Has solicitado un código para restablecer tu contraseña. Utiliza los siguientes números para completar el proceso:
                </p>
                
                <div style="margin: 35px 0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color: #f0fdf4; border: 2px dashed #7cd36d; border-radius: 4px; padding: 15px 30px;">
                        <span style="font-size: 36px; font-weight: bold; color: #2d5a27; letter-spacing: 10px; font-family: monospace;">
                          ${nuevoCodigo}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="color: #888888; font-size: 13px; margin-top: 20px;">
                  Este código expirará pronto. Si no has solicitado este cambio, por favor ignora este correo.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
                <p style="margin: 0;">&copy; 2026 <b>Gramas y Suministros S.A.S.</b></p>
                <p style="margin: 5px 0 0 0;">Soacha, Cundinamarca, Colombia.</p>
              </td>
            </tr>

          </table>
        </div>
      `,
    });

    console.log(`CÓDIGO GENERADO Y ENVIADO A: ${email}`);
    return { message: 'Código enviado con éxito al correo' };
  }

  async restablecerPassword(codigo: string, nuevaPassword: string) {
    const registro = await this.resetRepo.findOne({
      where: { codigo, usado: 0 },
    });
    if (!registro) throw new BadRequestException('Código inválido o ya usado');

    const user = await this.userRepo.findOne({
      where: { email: registro.email },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Encriptar la nueva contraseña
    user.passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await this.userRepo.save(user);

    // Marcar código como usado
    registro.usado = 1;
    await this.resetRepo.save(registro);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
