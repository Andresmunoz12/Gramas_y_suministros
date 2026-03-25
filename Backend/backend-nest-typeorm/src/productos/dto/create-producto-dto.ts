import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUrl,
  IsInt,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  peso?: number;

  @ApiProperty({ example: 'Polietileno', description: 'Material principal' })
  @IsString()
  @IsNotEmpty()
  material: string;

  @ApiProperty({ example: 45000, description: 'Precio unitario' })
  @IsNumber()
  @Min(0)
  precio: number;

  @ApiProperty({ example: 1, description: 'ID de la categoría (Relación)' })
  @IsInt()
  id_categoria: number;

  @ApiProperty({ example: 'https://imagen.com/grama.jpg', required: false })
  @IsOptional()
  @IsUrl()
  imagen?: string;
}
