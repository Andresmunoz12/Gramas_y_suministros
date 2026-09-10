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
import { google } from 'googleapis';

@Injectable()
export class AuthService {

  private readonly gmail;

  constructor(
    @InjectRepository(usuario)
    private readonly userRepo: Repository<usuario>,

    @InjectRepository(PasswordReset)
    private readonly resetRepo: Repository<PasswordReset>,
  ) {

    // =====================================================
    // CONFIGURACIÓN DE GOOGLE OAUTH
    // =====================================================

    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN ||
      !process.env.GMAIL_USER
    ) {
      throw new Error(
        'Las variables de entorno de Gmail OAuth2 no están configuradas correctamente.',
      );
    }

    // Cliente OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
    );

    // Refresh Token generado desde Google OAuth
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    // Cliente de Gmail
    this.gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });
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
    // 5. Crear correo MIME
    // -----------------------------------------------------

    const from = `Gramas y Suministros <${process.env.GMAIL_USER}>`;

    const subject =
      'Tu código de recuperación - Gramas y Suministros';

    const message = [
      `From: ${from}`,
      `To: ${email}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      html,
    ].join('\r\n');


    // -----------------------------------------------------
    // 6. Codificar correo en Base64 URL Safe
    // -----------------------------------------------------

    const encodedMessage = Buffer
      .from(message, 'utf-8')
      .toString('base64url');


    // -----------------------------------------------------
    // 7. Enviar mediante Gmail API
    // -----------------------------------------------------

    try {

      const response =
        await this.gmail.users.messages.send({
          userId: 'me',

          requestBody: {
            raw: encodedMessage,
          },
        });


      console.log(
        `Correo de recuperación enviado a ${email}. ID: ${response.data.id}`,
      );


      return {
        message:
          'Código enviado con éxito al correo',
      };

    } catch (error) {

      console.error(
        'Error enviando correo mediante Gmail:',
        error?.response?.data || error,
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