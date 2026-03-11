import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  @Length(3, 150)
  nombre: string;

  @IsString()
  @IsOptional()
  contacto?: string;

  @IsString()
  @IsOptional()
  @Length(7, 20)
  telefono?: string;

  @IsEmail({}, { message: 'El formato del email no es válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(5, 255)
  direccion?: string;
}
