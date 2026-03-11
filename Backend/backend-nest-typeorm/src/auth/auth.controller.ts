import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const password = loginDto.password_hash || loginDto.pass;
    if (!password) {
      throw new BadRequestException('La contraseña es obligatoria');
    }
    return await this.authService.login(loginDto.email, password);
  }
}
