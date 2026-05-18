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
exports.categoria = void 0;
const typeorm_1 = require("typeorm");
const productos_entity_1 = require("../productos/productos.entity");
let categoria = class categoria {
    id_categoria;
    nombre;
    descripcion;
    productos;
};
exports.categoria = categoria;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_categoria' }),
    __metadata("design:type", Number)
], categoria.prototype, "id_categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], categoria.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion', length: 100 }),
    __metadata("design:type", String)
], categoria.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => productos_entity_1.productos, (p) => p.categoria),
    __metadata("design:type", Array)
], categoria.prototype, "productos", void 0);
exports.categoria = categoria = __decorate([
    (0, typeorm_1.Entity)('categoria')
], categoria);
//# sourceMappingURL=categoria.entity.js.map