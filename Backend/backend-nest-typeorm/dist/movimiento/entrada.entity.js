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
exports.entrada = void 0;
const typeorm_1 = require("typeorm");
const movimiento_entity_1 = require("./movimiento.entity");
const proveedores_entity_1 = require("../proveedores/proveedores.entity");
let entrada = class entrada {
    id_movimiento;
    movimiento;
    proveedor;
    id_proveedor;
    precio_unitario;
    lote;
    observaciones;
};
exports.entrada = entrada;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'id_movimiento' }),
    __metadata("design:type", Number)
], entrada.prototype, "id_movimiento", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => movimiento_entity_1.movimiento, (movimiento) => movimiento.entrada, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'id_movimiento' }),
    __metadata("design:type", movimiento_entity_1.movimiento)
], entrada.prototype, "movimiento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => proveedores_entity_1.proveedor, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'id_proveedor' }),
    __metadata("design:type", proveedores_entity_1.proveedor)
], entrada.prototype, "proveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_proveedor', nullable: true }),
    __metadata("design:type", Number)
], entrada.prototype, "id_proveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
        name: 'precio_unitario',
    }),
    __metadata("design:type", Number)
], entrada.prototype, "precio_unitario", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], entrada.prototype, "lote", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], entrada.prototype, "observaciones", void 0);
exports.entrada = entrada = __decorate([
    (0, typeorm_1.Entity)('entrada')
], entrada);
//# sourceMappingURL=entrada.entity.js.map