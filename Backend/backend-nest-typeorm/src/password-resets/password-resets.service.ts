import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { usuario } from '../Usuarios/usuarios.entity';
import { PasswordReset } from './password-resets.entity';

import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';

@Injectable()
export class AuthService {

  private readonly resend: Resend;

  constructor(
    @InjectRepository(usuario)
    private readonly userRepo: Repository<usuario>,

    @InjectRepository(PasswordReset)
    private readonly resetRepo: Repository<PasswordReset>,
  ) {

    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY no está configurada en las variables de entorno.',
      );
    }

    this.resend = new Resend(
      process.env.RESEND_API_KEY,
    );
  }


  // =====================================================
  // SOLICITAR CÓDIGO DE RECUPERACIÓN
  // =====================================================

  async solicitarRecuperacion(email: string) {

    // -----------------------------------------------------
    // 1. Buscar usuario
    // -----------------------------------------------------

    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(
        'El correo no está registrado',
      );
    }


    // -----------------------------------------------------
    // 2. Generar código de 6 dígitos
    // -----------------------------------------------------

    const nuevoCodigo = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();


    // -----------------------------------------------------
    // 3. Guardar código en la base de datos
    // -----------------------------------------------------

    const reset = this.resetRepo.create({
      email: email,
      codigo: nuevoCodigo,
      usado: 0,
    });

    await this.resetRepo.save(reset);


    // -----------------------------------------------------
    // 4. HTML del correo
    // -----------------------------------------------------

    const html = `
      <div
        style="
          margin: 0;
          padding: 20px 0;
          background-color: #f9f9f9;
          font-family: 'Segoe UI', Arial, sans-serif;
        "
      >

        <table
          align="center"
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="100%"
          style="
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e0e0e0;
          "
        >

          <!-- ENCABEZADO -->

          <tr>

            <td
              style="
                background-color: #7cd36d;
                padding: 30px 20px;
                text-align: center;
              "
            >

              <h1
                style="
                  color: #ffffff;
                  margin: 0;
                  font-size: 26px;
                  font-weight: 700;
                  letter-spacing: 1px;
                  text-transform: uppercase;
                "
              >
                Gramas y Suministros
              </h1>

            </td>

          </tr>


          <!-- CONTENIDO -->

          <tr>

            <td
              style="
                padding: 40px 20px;
                text-align: center;
              "
            >

              <h2
                style="
                  color: #333333;
                  margin: 0 0 15px 0;
                  font-size: 22px;
                "
              >
                Verificación de Identidad
              </h2>


              <p
                style="
                  color: #666666;
                  font-size: 16px;
                  line-height: 1.5;
                  margin: 0 auto;
                  max-width: 450px;
                "
              >
                Has solicitado un código para restablecer
                tu contraseña. Utiliza los siguientes
                números para completar el proceso:
              </p>


              <!-- CÓDIGO -->

              <div
                style="
                  margin: 35px 0;
                "
              >

                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                >

                  <tr>

                    <td
                      style="
                        background-color: #f0fdf4;
                        border: 2px dashed #7cd36d;
                        border-radius: 4px;
                        padding: 15px 30px;
                      "
                    >

                      <span
                        style="
                          font-size: 36px;
                          font-weight: bold;
                          color: #2d5a27;
                          letter-spacing: 10px;
                          font-family: monospace;
                        "
                      >
                        ${nuevoCodigo}
                      </span>

                    </td>

                  </tr>

                </table>

              </div>


              <p
                style="
                  color: #888888;
                  font-size: 13px;
                  margin-top: 20px;
                "
              >
                Este código expirará pronto.
                Si no has solicitado este cambio,
                puedes ignorar este correo.
              </p>

            </td>

          </tr>


          <!-- PIE -->

          <tr>

            <td
              style="
                background-color: #f4f4f4;
                padding: 20px;
                text-align: center;
                color: #999999;
                font-size: 12px;
              "
            >

              <p style="margin: 0;">
                &copy; 2026
                <b>Gramas y Suministros S.A.S.</b>
              </p>

              <p
                style="
                  margin: 5px 0 0 0;
                "
              >
                Soacha, Cundinamarca, Colombia.
              </p>

            </td>

          </tr>

        </table>

      </div>
    `;


    // -----------------------------------------------------
    // 5. Enviar correo mediante Resend
    // -----------------------------------------------------

    try {

      const { data, error } =
        await this.resend.emails.send({

          from:
            process.env.MAIL_FROM ||
            'Gramas y Suministros <onboarding@resend.dev>',

          to: [email],

          subject:
            'Tu código de recuperación - Gramas y Suministros',

          html: html,
        });


      // ---------------------------------------------------
      // 6. Comprobar respuesta de Resend
      // ---------------------------------------------------

      if (error) {

        console.error(
          'Error de Resend:',
          error,
        );

        throw new InternalServerErrorException(
          'No se pudo enviar el correo de recuperación.',
        );
      }


      console.log(
        `Correo de recuperación enviado a ${email}. ID: ${data?.id}`,
      );


      return {
        message:
          'Código enviado con éxito al correo',
      };

    } catch (error) {

      console.error(
        'Error enviando correo de recuperación:',
        error,
      );

      throw new InternalServerErrorException(
        'No se pudo enviar el correo de recuperación.',
      );
    }
  }


  // =====================================================
  // RESTABLECER CONTRASEÑA
  // =====================================================

  async restablecerPassword(
    codigo: string,
    nuevaPassword: string,
  ) {

    // -----------------------------------------------------
    // 1. Buscar código
    // -----------------------------------------------------

    const registro =
      await this.resetRepo.findOne({
        where: {
          codigo,
          usado: 0,
        },
      });


    if (!registro) {

      throw new BadRequestException(
        'Código inválido o ya usado',
      );

    }


    // -----------------------------------------------------
    // 2. Buscar usuario
    // -----------------------------------------------------

    const user =
      await this.userRepo.findOne({
        where: {
          email: registro.email,
        },
      });


    if (!user) {

      throw new NotFoundException(
        'Usuario no encontrado',
      );

    }


    // -----------------------------------------------------
    // 3. Encriptar nueva contraseña
    // -----------------------------------------------------

    user.passwordHash =
      await bcrypt.hash(
        nuevaPassword,
        10,
      );


    await this.userRepo.save(user);


    // -----------------------------------------------------
    // 4. Marcar código como usado
    // -----------------------------------------------------

    registro.usado = 1;

    await this.resetRepo.save(
      registro,
    );


    return {
      message:
        'Contraseña actualizada correctamente',
    };
  }
}