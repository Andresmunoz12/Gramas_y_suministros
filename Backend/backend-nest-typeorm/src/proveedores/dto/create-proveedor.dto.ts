import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({
    example: 'Vivero El Rosal',
    description: 'Nombre legal o comercial',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  @Length(3, 150)
  nombre: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Persona de contacto',
  })
  @IsString()
  @IsOptional()
  contacto?: string;

  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Teléfono de contacto',
  })
  @IsString()
  @IsOptional()
  @Length(7, 20)
  telefono?: string;

  @ApiPropertyOptional({
    example: 'contacto@vivero.com',
    description: 'Correo electrónico',
  })
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Calle 10 #45-12, Bogotá',
    description: 'Dirección física',
  })
  @IsString()
  @IsOptional()
  @Length(5, 255)
  direccion?: string;
}
