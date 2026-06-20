import {
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoEntradaDto {
  @ApiProperty({ example: 1, description: 'ID del producto que ingresa' })
  @IsInt()
  id_producto: number;

  @ApiProperty({
    example: 5,
    description: 'ID del usuario que registra la entrada',
  })
  @IsInt()
  id_usuario: number;

  @ApiProperty({ example: 100, description: 'Cantidad de unidades que entran' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({
    example: 'Compra de stock mensual',
    description: 'Breve detalle del movimiento',
  })
  @IsString()
  @IsOptional()
  detalle?: string;

  @ApiProperty({ example: 2, description: 'ID del proveedor de la mercancía' })
  @IsInt()
  id_proveedor: number;

  @ApiPropertyOptional({
    example: 15.5,
    description: 'Precio de costo por unidad',
  })
  @IsNumber()
  @IsOptional()
  precio_unitario?: number;

  @ApiPropertyOptional({
    example: 'LOTE-2024-ABC',
    description: 'Código de lote del producto',
  })
  @IsString()
  @IsOptional()
  lote?: string;

  @ApiPropertyOptional({
    example: 'Llegó con empaque sellado',
    description: 'Notas adicionales',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
