import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'prueba@gmail.com',
    description: 'Correo electrónico registrado del usuario',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '12345678',
    description:
      'Contraseña del usuario (enviada como password_hash para coincidir con el backend)',
    minLength: 8,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password_hash?: string;
}
