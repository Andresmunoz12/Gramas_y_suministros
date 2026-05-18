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
exports.stock = void 0;
const typeorm_1 = require("typeorm");
const productos_entity_1 = require("../productos/productos.entity");
let stock = class stock {
    id_producto;
    producto;
    cantidad_actual;
    nivel_minimo;
    ultima_actualizacion;
};
exports.stock = stock;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'id_producto' }),
    __metadata("design:type", Number)
], stock.prototype, "id_producto", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => productos_entity_1.productos),
    (0, typeorm_1.JoinColumn)({ name: 'id_producto' }),
    __metadata("design:type", productos_entity_1.productos)
], stock.prototype, "producto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cantidad_actual', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], stock.prototype, "cantidad_actual", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nivel_minimo', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], stock.prototype, "nivel_minimo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'ultima_actualizacion',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], stock.prototype, "ultima_actualizacion", void 0);
exports.stock = stock = __decorate([
    (0, typeorm_1.Entity)('stock')
], stock);
//# sourceMappingURL=stock.entity.js.map