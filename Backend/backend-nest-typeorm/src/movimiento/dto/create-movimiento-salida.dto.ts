import { IsInt, IsString, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoSalidaDto {
  @ApiProperty({ example: 1, description: 'ID del producto que sale' })
  @IsInt()
  id_producto: number;

  @ApiProperty({
    example: 5,
    description: 'ID del usuario que registra la salida',
  })
  @IsInt()
  id_usuario: number;

  @ApiProperty({ example: 20, description: 'Cantidad de unidades a retirar' })
  @IsInt()
  @IsPositive()
  cantidad: number;

  @ApiPropertyOptional({ example: 'Despacho a cliente local' })
  @IsString()
  @IsOptional()
  detalle?: string;

  @ApiProperty({
    example: 'Sucursal Norte',
    description: 'Lugar de destino del producto',
  })
  @IsString()
  destino: string;

  @ApiProperty({ example: 'Venta Directa', description: 'Razón de la salida' })
  @IsString()
  motivo: string;

  @ApiPropertyOptional({ example: 'Entrega urgente' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
