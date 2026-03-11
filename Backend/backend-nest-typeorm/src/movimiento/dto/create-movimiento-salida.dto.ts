import { IsInt, IsString, IsOptional, IsPositive } from 'class-validator';

export class CreateMovimientoSalidaDto {
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

  // Datos específicos de la Salida
  @IsString()
  destino: string;

  @IsString()
  motivo: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
