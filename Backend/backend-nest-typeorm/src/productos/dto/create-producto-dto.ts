import {
  IsString,
  IsNumber,
  IsOptional,
  IsDecimal,
  Min,
  IsUrl,
  IsInt,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  nombre: string;

  @IsString()
  marca: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  peso?: number;

  @IsString()
  material: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura?: number;

  @IsInt() // Validamos que llegue el ID de la categoría
  id_categoria: number;

  @IsOptional()
  @IsUrl() // Validamos que sea una URL válida
  imagen?: string;
}
