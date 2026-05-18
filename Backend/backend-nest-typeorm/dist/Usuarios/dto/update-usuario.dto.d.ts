import { CreateUsuarioDto } from './create-usurio-dto';
declare const UpdateUsuarioDto_base: import("@nestjs/common").Type<Partial<Omit<CreateUsuarioDto, "password_hash">>>;
export declare class UpdateUsuarioDto extends UpdateUsuarioDto_base {
}
export {};
