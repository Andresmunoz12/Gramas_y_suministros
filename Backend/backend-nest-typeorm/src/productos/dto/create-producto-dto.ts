// src/productos/dto/create-producto-dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUrl,
  IsInt,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductoDto {
  @ApiProperty({
    example: 'Grama Sintética Premium',
    description: 'Nombre del producto',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Evergreen', description: 'Marca del fabricante' })
  @IsString()
  @IsNotEmpty()
  marca: string;

  @ApiProperty({
    example: 2.5,
    required: false,
    description: 'Peso en kilogramos',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  peso?: number;

  @ApiProperty({ example: 'Polietileno', description: 'Material principal' })
  @IsString()
  @IsNotEmpty()
  material: string;

  @ApiProperty({
    example: 'Grama de alta calidad',
    description: 'Descripción del producto',
    required: false,
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ example: 45000, description: 'Precio unitario' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio: number;

  @ApiProperty({
    example: 3.5,
    description: 'Altura del producto',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  altura?: number;

  @ApiProperty({ example: 1, description: 'ID de la categoría (Relación)' })
  @IsInt()
  @Type(() => Number)
  id_categoria: number;

  @ApiProperty({
    example: 'https://imagen.com/grama.jpg',
    description: 'URL de la imagen',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  imagen?: string;

  // ✅ AGREGADO: Campo estado (opcional, por defecto 1)
  @ApiProperty({
    example: 1,
    description: 'Estado del producto: 1=Activo, 0=Inactivo',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  estado?: number;
}