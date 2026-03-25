import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Autorizacion') // Crea la sección en Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Obtén un access_token para acceder a las rutas protegidas de Gramas y Suministros.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso.',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 1, nombre: 'Andres Felipe', email: 'prueba@gmail.com' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas.',
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2026-03-18T00:12:20.400Z',
        path: '/auth/login',
        message: 'Credenciales inválidas',
        errorName: 'UnauthorizedException',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Faltan campos obligatorios.',
    example: {
      statusCode: 400,
      timestamp: '2026-03-18T00:13:49.259Z',
      path: '/auth/login',
      message: 'password_hash must be longer than or equal to 8 characters',
      errorName: 'BadRequestException',
    },
  })
  async login(@Body() loginDto: LoginDto) {
    // Validamos cuál de los dos campos de contraseña viene desde el cliente
    const password = loginDto.password_hash;

    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }

    return await this.authService.login(loginDto.email, password);
  }
}
