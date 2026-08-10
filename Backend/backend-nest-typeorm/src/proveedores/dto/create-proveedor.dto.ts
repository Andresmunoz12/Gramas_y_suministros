import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({
    example: 'Vivero El Rosal',
    description: 'Nombre legal o comercial del proveedor',
  })
  @IsString({
    message: 'El nombre del proveedor debe ser texto',
  })
  @IsNotEmpty({
    message: 'El nombre del proveedor es obligatorio',
  })
  @Length(3, 150, {
    message: 'El nombre debe tener entre 3 y 150 caracteres',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message:
      'El nombre solo puede contener letras y espacios',
  })
  nombre: string;

  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Persona de contacto',
  })
  @IsString({
    message: 'El contacto debe ser texto',
  })
  @IsOptional()
  @Length(3, 150, {
    message: 'El contacto debe tener entre 3 y 150 caracteres',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, {
    message:
      'El contacto solo puede contener letras y espacios',
  })
  contacto?: string;

  @ApiPropertyOptional({
    example: '3001234567',
    description: 'Teléfono de contacto',
  })
  @IsString({
    message: 'El teléfono debe ser enviado como texto',
  })
  @IsOptional()
  @Length(7, 20, {
    message: 'El teléfono debe tener entre 7 y 20 dígitos',
  })
  @Matches(/^\d+$/, {
    message: 'El teléfono solo puede contener números',
  })
  telefono?: string;

  @ApiPropertyOptional({
    example: 'contacto@vivero.com',
    description: 'Correo electrónico',
  })
  @IsEmail({}, {
    message: 'El formato del email no es válido',
  })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'Calle 10 #45-12, Bogotá',
    description: 'Dirección física',
  })
  @IsString({
    message: 'La dirección debe ser texto',
  })
  @IsOptional()
  @Length(5, 255, {
    message: 'La dirección debe tener entre 5 y 255 caracteres',
  })
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s#.,\-°/]+$/, {
    message:
      'La dirección contiene caracteres no permitidos',
  })
  direccion?: string;
}