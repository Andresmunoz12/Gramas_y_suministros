import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUsuarioDto } from './create-usurio-dto';

export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ['password_hash'] as const),
) {}
