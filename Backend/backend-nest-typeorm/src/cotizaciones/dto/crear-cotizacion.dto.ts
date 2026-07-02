// src/cotizaciones/dto/crear-cotizacion.dto.ts
import { IsEnum, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemCotizacionDto {
  @IsNumber()
  idProducto: number;

  @IsNumber()
  @Min(1)
  cantidad: number;
}

export class CrearCotizacionDto {
  @IsEnum(['fisico', 'envio'])
  metodoVenta: string;

  @IsEnum(['efectivo', 'tarjeta_debito', 'tarjeta_credito'])
  metodoPago: string;

  @IsOptional()
  @IsString()
  direccionEnvio?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCotizacionDto)
  items: ItemCotizacionDto[];
}