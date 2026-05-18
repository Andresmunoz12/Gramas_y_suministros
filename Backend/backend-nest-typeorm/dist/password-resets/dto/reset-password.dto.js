"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestablecerPasswordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RestablecerPasswordDto {
    codigo_verificacion;
    nueva_password;
}
exports.RestablecerPasswordDto = RestablecerPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '123456',
        description: 'Código de 6 dígitos recibido por correo',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El código de verificación es obligatorio' }),
    __metadata("design:type", String)
], RestablecerPasswordDto.prototype, "codigo_verificacion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'NuevaClave2026',
        description: 'La nueva contraseña que desea establecer',
        minLength: 8,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'La nueva contraseña no puede estar vacía' }),
    (0, class_validator_1.MinLength)(8, {
        message: 'La nueva contraseña debe tener al menos 8 caracteres',
    }),
    __metadata("design:type", String)
], RestablecerPasswordDto.prototype, "nueva_password", void 0);
//# sourceMappingURL=reset-password.dto.js.map