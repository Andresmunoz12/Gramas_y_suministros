import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './password-resets.service';

@Controller('auth') // La URL será: http://localhost:3000/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Paso 1: El usuario ingresa su correo y se genera un código.
   * POST: http://localhost:3000/auth/solicitar-codigo
   */
  @Post('solicitar-codigo')
  async solicitarCodigo(@Body('email') email: string) {
    if (!email) throw new BadRequestException('El correo es requerido');
    // Este nombre debe ser IGUAL al del service
    return this.authService.solicitarRecuperacion(email);
  }

  @Post('restablecer-password')
  async restablecerPassword(
    @Body('codigo') codigo: string,
    @Body('nuevaPassword') nuevaPassword: string,
  ) {
    return this.authService.restablecerPassword(codigo, nuevaPassword);
  }
}
