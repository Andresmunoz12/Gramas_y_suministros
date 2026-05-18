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
exports.movimiento = void 0;
const typeorm_1 = require("typeorm");
const productos_entity_1 = require("../productos/productos.entity");
const usuarios_entity_1 = require("../Usuarios/usuarios.entity");
const entrada_entity_1 = require("./entrada.entity");
const salida_entity_1 = require("./salida.entity");
let movimiento = class movimiento {
    id_movimiento;
    producto;
    id_producto;
    usuario;
    id_usuario;
    fecha;
    cantidad;
    detalle;
    tipo;
    entrada;
    salida;
};
exports.movimiento = movimiento;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_movimiento' }),
    __metadata("design:type", Number)
], movimiento.prototype, "id_movimiento", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => productos_entity_1.productos),
    (0, typeorm_1.JoinColumn)({ name: 'id_producto' }),
    __metadata("design:type", productos_entity_1.productos)
], movimiento.prototype, "producto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_producto' }),
    __metadata("design:type", Number)
], movimiento.prototype, "id_producto", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuarios_entity_1.usuario),
    (0, typeorm_1.JoinColumn)({ name: 'id_usuario' }),
    __metadata("design:type", usuarios_entity_1.usuario)
], movimiento.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_usuario' }),
    __metadata("design:type", Number)
], movimiento.prototype, "id_usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], movimiento.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], movimiento.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], movimiento.prototype, "detalle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['entrada', 'salida'], nullable: true }),
    __metadata("design:type", String)
], movimiento.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => entrada_entity_1.entrada, (entrada) => entrada.movimiento, { cascade: true }),
    __metadata("design:type", entrada_entity_1.entrada)
], movimiento.prototype, "entrada", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => salida_entity_1.salida, (salida) => salida.movimiento, { cascade: true }),
    __metadata("design:type", salida_entity_1.salida)
], movimiento.prototype, "salida", void 0);
exports.movimiento = movimiento = __decorate([
    (0, typeorm_1.Entity)('movimiento')
], movimiento);
//# sourceMappingURL=movimiento.entity.js.map