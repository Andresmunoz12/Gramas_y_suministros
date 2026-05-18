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
exports.productos = void 0;
const typeorm_1 = require("typeorm");
const categoria_entity_1 = require("../categoria/categoria.entity");
let productos = class productos {
    id_producto;
    nombre;
    marca;
    peso;
    material;
    descripcion;
    precio;
    altura;
    categoria;
    imagen;
    estado;
    createdAt;
    updatedAt;
};
exports.productos = productos;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_producto' }),
    __metadata("design:type", Number)
], productos.prototype, "id_producto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], productos.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'marca', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], productos.prototype, "marca", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'peso',
        type: 'decimal',
        precision: 10,
        scale: 3,
        nullable: true,
    }),
    __metadata("design:type", Number)
], productos.prototype, "peso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'material', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], productos.prototype, "material", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion', type: 'text', nullable: true }),
    __metadata("design:type", String)
], productos.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'precio',
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
    }),
    __metadata("design:type", Number)
], productos.prototype, "precio", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'altura',
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], productos.prototype, "altura", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => categoria_entity_1.categoria, (c) => c.productos),
    (0, typeorm_1.JoinColumn)({ name: 'id_categoria' }),
    __metadata("design:type", categoria_entity_1.categoria)
], productos.prototype, "categoria", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'imagen', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], productos.prototype, "imagen", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado',
        type: 'tinyint',
        default: 1,
        comment: '1 = Activo, 0 = Inactivo/Desactivado',
    }),
    __metadata("design:type", Number)
], productos.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], productos.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'updated_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], productos.prototype, "updatedAt", void 0);
exports.productos = productos = __decorate([
    (0, typeorm_1.Entity)('producto')
], productos);
//# sourceMappingURL=productos.entity.js.map