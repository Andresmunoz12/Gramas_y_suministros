import {
  IsEnum,
  IsString,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({
    example: 'almacenista',
    description: 'El tipo de rol permitido en el sistema',
    enum: ['administrador', 'cliente', 'almacenista'],
  })
  @IsEnum(['administrador', 'cliente', 'almacenista'], {
    message: 'El tipo debe ser administrador, cliente o almacenista',
  })
  @IsNotEmpty({ message: 'El tipo de rol es obligatorio' })
  tipo: string;

  @ApiProperty({
    example: 'Encargado de la entrada y salida de mercancía',
    description: 'Descripción breve de las funciones del rol',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
