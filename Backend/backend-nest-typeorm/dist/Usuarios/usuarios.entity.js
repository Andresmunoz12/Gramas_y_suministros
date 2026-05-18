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
exports.usuario = void 0;
const typeorm_1 = require("typeorm");
const roles_entity_1 = require("../roles/roles.entity");
let usuario = class usuario {
    id_usuario;
    nombre;
    apellido;
    email;
    passwordHash;
    estado;
    id_rol;
    rol;
    createdAt;
    updatedAt;
};
exports.usuario = usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'id_usuario' }),
    __metadata("design:type", Number)
], usuario.prototype, "id_usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nombre', length: 100 }),
    __metadata("design:type", String)
], usuario.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'apellido', length: 100, nullable: true }),
    __metadata("design:type", String)
], usuario.prototype, "apellido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email', length: 150, unique: true }),
    __metadata("design:type", String)
], usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false, name: 'password_hash', length: 255, nullable: true }),
    __metadata("design:type", String)
], usuario.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'estado',
        type: 'enum',
        enum: ['activo', 'inactivo', 'suspendido'],
        default: 'activo',
    }),
    __metadata("design:type", String)
], usuario.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'id_rol' }),
    __metadata("design:type", Number)
], usuario.prototype, "id_rol", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => roles_entity_1.rol, (r) => r.usuario),
    (0, typeorm_1.JoinColumn)({ name: 'id_rol' }),
    __metadata("design:type", roles_entity_1.rol)
], usuario.prototype, "rol", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'created_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], usuario.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'updated_at',
        type: 'datetime',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], usuario.prototype, "updatedAt", void 0);
exports.usuario = usuario = __decorate([
    (0, typeorm_1.Entity)('usuario')
], usuario);
//# sourceMappingURL=usuarios.entity.js.map