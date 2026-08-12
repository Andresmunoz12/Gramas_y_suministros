import { IsInt, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStockMinimoDto {
  @ApiProperty({
    description: 'Nivel mínimo permitido de stock para generar alertas',
    example: 15,
  })
  @IsNotEmpty({ message: 'El nivel mínimo es obligatorio' })
  @IsInt({ message: 'El nivel mínimo debe ser un número entero' })
  @Min(0, { message: 'El nivel mínimo no puede ser negativo' })
  nivel_minimo: number;
}
