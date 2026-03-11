import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateRolDto {
  @IsEnum(['administrador', 'cliente', 'almacenista'], {
    message: 'El tipo debe ser administrador, cliente o almacenista',
  })
  tipo: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;
}
