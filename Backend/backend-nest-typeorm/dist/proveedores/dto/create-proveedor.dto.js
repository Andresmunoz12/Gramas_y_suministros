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
exports.CreateProveedorDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateProveedorDto {
    nombre;
    contacto;
    telefono;
    email;
    direccion;
}
exports.CreateProveedorDto = CreateProveedorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Vivero El Rosal',
        description: 'Nombre legal o comercial',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del proveedor es obligatorio' }),
    (0, class_validator_1.Length)(3, 150),
    __metadata("design:type", String)
], CreateProveedorDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Juan Pérez',
        description: 'Persona de contacto',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProveedorDto.prototype, "contacto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '3001234567',
        description: 'Teléfono de contacto',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(7, 20),
    __metadata("design:type", String)
], CreateProveedorDto.prototype, "telefono", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'contacto@vivero.com',
        description: 'Correo electrónico',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'El formato del email no es válido' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateProveedorDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Calle 10 #45-12, Bogotá',
        description: 'Dirección física',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Length)(5, 255),
    __metadata("design:type", String)
], CreateProveedorDto.prototype, "direccion", void 0);
//# sourceMappingURL=create-proveedor.dto.js.map