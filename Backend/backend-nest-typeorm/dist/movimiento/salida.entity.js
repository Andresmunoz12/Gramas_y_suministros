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
exports.salida = void 0;
const typeorm_1 = require("typeorm");
const movimiento_entity_1 = require("./movimiento.entity");
let salida = class salida {
    id_movimiento;
    movimiento;
    destino;
    motivo;
    observaciones;
};
exports.salida = salida;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'id_movimiento' }),
    __metadata("design:type", Number)
], salida.prototype, "id_movimiento", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => movimiento_entity_1.movimiento, (movimiento) => movimiento.salida, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_movimiento' }),
    __metadata("design:type", movimiento_entity_1.movimiento)
], salida.prototype, "movimiento", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], salida.prototype, "destino", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], salida.prototype, "motivo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], salida.prototype, "observaciones", void 0);
exports.salida = salida = __decorate([
    (0, typeorm_1.Entity)('salida')
], salida);
//# sourceMappingURL=salida.entity.js.map