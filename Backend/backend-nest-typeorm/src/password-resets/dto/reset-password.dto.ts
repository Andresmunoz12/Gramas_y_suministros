import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RestablecerPasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos recibido por correo',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  codigo_verificacion: string;

  @ApiProperty({
    example: 'NuevaClave2026',
    description: 'La nueva contraseña que desea establecer',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía' })
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  nueva_password: string;
}
