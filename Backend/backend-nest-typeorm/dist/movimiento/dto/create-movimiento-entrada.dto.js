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
exports.CreateMovimientoEntradaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateMovimientoEntradaDto {
    id_producto;
    id_usuario;
    cantidad;
    detalle;
    id_proveedor;
    precio_unitario;
    lote;
    observaciones;
}
exports.CreateMovimientoEntradaDto = CreateMovimientoEntradaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'ID del producto que ingresa' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMovimientoEntradaDto.prototype, "id_producto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5,
        description: 'ID del usuario que registra la entrada',
    }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMovimientoEntradaDto.prototype, "id_usuario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'Cantidad de unidades que entran' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateMovimientoEntradaDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Compra de stock mensual',
        description: 'Breve detalle del movimiento',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMovimientoEntradaDto.prototype, "detalle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'ID del proveedor de la mercancía' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateMovimientoEntradaDto.prototype, "id_proveedor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 15.5,
        description: 'Precio de costo por unidad',
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMovimientoEntradaDto.prototype, "precio_unitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'LOTE-2024-ABC',
        description: 'Código de lote del producto',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMovimientoEntradaDto.prototype, "lote", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Llegó con empaque sellado',
        description: 'Notas adicionales',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMovimientoEntradaDto.prototype, "observaciones", void 0);
//# sourceMappingURL=create-movimiento-entrada.dto.js.map