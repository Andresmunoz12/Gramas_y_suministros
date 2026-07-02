// src/cotizaciones/dto/actualizar-estado.dto.ts
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarEstadoDto {
  @ApiProperty({
    enum: ['pendiente', 'pagado', 'entregado', 'cancelado'],
    example: 'pagado',
    description: 'Nuevo estado de la cotización',
  })
  @IsEnum(['pendiente', 'pagado', 'entregado', 'cancelado'])
  estado: string;
}