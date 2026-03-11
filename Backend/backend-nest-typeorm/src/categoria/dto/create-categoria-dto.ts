import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @IsString()
  @MaxLength(100)
  descripcion: string;
}
