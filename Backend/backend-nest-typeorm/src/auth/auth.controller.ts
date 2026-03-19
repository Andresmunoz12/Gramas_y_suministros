import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    const password = loginDto.password_hash || loginDto.pass;
    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }
    return await this.authService.login(loginDto.email, password);
  }

  // Para cuanto queramos hacer un registro (necesitamos un dto.) proximamente:
  //@Public()
  //@Post('register')
  //@ApiOperation({ summary: 'Registrar nuevo usuario' })
  //async register(@Body() registerDto: any) {
  //return this.authService.register(registerDto);
  //}
}