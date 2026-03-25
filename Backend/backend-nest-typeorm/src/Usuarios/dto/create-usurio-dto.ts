import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsuarioDto {
  @ApiProperty({
    example: 'Andres Felipe',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    example: 'Muñoz',
    description: 'Apellido del usuario (Opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  apellido?: string;

  @ApiProperty({
    example: 'andres@gramas.com',
    description: 'Correo electrónico único',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'admin12345',
    description: 'Contraseña segura (mínimo 8 caracteres)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password_hash: string;

  @ApiProperty({
    example: 1,
    description: 'Rol asignado (1: Administrador, 2: Empleado/Cliente)',
    enum: [1, 2],
  })
  @IsNumber() // Es importante validar que sea un número
  @IsNotEmpty()
  id_rol: number;
}
