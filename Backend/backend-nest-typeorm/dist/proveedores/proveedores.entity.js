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
exports.proveedor = void 0;
const typeorm_1 = require("typeorm");
const entrada_entity_1 = require("../movimiento/entrada.entity");
let proveedor = class proveedor {
    id_proveedor;
    nombre;
    contacto;
    telefono;
    email;
    direccion;
    entradas;
};
exports.proveedor = proveedor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_proveedor' }),
    __metadata("design:type", Number)
], proveedor.prototype, "id_proveedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], proveedor.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], proveedor.prototype, "contacto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], proveedor.prototype, "telefono", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], proveedor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], proveedor.prototype, "direccion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => entrada_entity_1.entrada, (entrada) => entrada.proveedor),
    __metadata("design:type", Array)
], proveedor.prototype, "entradas", void 0);
exports.proveedor = proveedor = __decorate([
    (0, typeorm_1.Entity)('proveedor')
], proveedor);
//# sourceMappingURL=proveedores.entity.js.map