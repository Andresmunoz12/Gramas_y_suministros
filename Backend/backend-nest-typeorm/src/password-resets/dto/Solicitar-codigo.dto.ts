import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SolicitarCodigoDto {
  @ApiProperty({
    example: 'usuario@gmail.com',
    description:
      'Correo electrónico donde se enviará el código de verificación',
  })
  @IsEmail({}, { message: 'El formato del correo no es válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  email: string;
}
