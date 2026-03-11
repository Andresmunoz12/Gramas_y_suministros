import {
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateMovimientoEntradaDto {
  // Datos base del Movimiento
  @IsInt()
  id_producto: number;

  @IsInt()
  id_usuario: number;

  @IsInt()
  @IsPositive()
  cantidad: number;

  @IsString()
  @IsOptional()
  detalle?: string;

  // Datos específicos de la Entrada
  @IsInt()
  id_proveedor: number;

  @IsNumber()
  @IsOptional()
  precio_unitario?: number;

  @IsString()
  @IsOptional()
  lote?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
