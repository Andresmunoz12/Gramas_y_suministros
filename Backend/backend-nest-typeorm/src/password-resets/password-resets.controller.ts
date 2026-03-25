import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './password-resets.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator'; // Asegúrate de importar esto
import { SolicitarCodigoDto } from './dto/Solicitar-codigo.dto';
import { RestablecerPasswordDto } from './dto/reset-password.dto';

@ApiTags('Recuperar Contraseña')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // 👈 Importante: Permitir acceso sin token
  @Post('solicitar-codigo')
  @ApiOperation({ summary: 'Paso 1: Enviar código al correo' })
  @ApiResponse({
    status: 201,
    description: 'Código enviado.',
    schema: { example: { message: 'Se ha enviado un código a tu correo' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Error al Enviar codigo',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-20T16:07:04.226Z',
        path: '/auth/solicitar-codigo',
        message: 'El correo no está registrado',
        errorName: 'NotFoundException',
      },
    },
  })
  async solicitarCodigo(@Body() solicitarDto: SolicitarCodigoDto) {
    // Ya no necesitas el "if (!email)" porque el DTO lo valida solo
    return this.authService.solicitarRecuperacion(solicitarDto.email);
  }

  @Public() // 👈 Importante: Permitir acceso sin token
  @Post('restablecer-password')
  @ApiOperation({ summary: 'Paso 2: Cambiar contraseña con el código' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña actualizada correctamente.',
    schema: {
      example: { message: 'Contraseña actualizada correctamente' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido o contraseña muy corta.',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2026-03-20T16:11:49.841Z',
        path: '/auth/restablecer-password',
        message: 'Código inválido o ya usado',
        errorName: 'BadRequestException',
      },
    },
  })
  async restablecerPassword(@Body() restablecerDto: RestablecerPasswordDto) {
    // Pasamos los datos del DTO al service
    return this.authService.restablecerPassword(
      restablecerDto.codigo_verificacion,
      restablecerDto.nueva_password,
    );
  }
}
