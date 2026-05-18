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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const roles_entity_1 = require("./roles.entity");
let RolesService = class RolesService {
    rolRepository;
    constructor(rolRepository) {
        this.rolRepository = rolRepository;
    }
    async create(createRolDto) {
        const existe = await this.rolRepository.findOne({
            where: { tipo: createRolDto.tipo },
        });
        if (existe) {
            throw new common_1.ConflictException(`El rol de tipo ${createRolDto.tipo} ya existe.`);
        }
        const nuevoRol = this.rolRepository.create(createRolDto);
        return await this.rolRepository.save(nuevoRol);
    }
    async findAll() {
        return await this.rolRepository.find({ relations: ['usuario'] });
    }
    async update(id, updateRolDto) {
        const rol = await this.findOne(id);
        const rolActualizado = this.rolRepository.merge(rol, updateRolDto);
        return await this.rolRepository.save(rolActualizado);
    }
    async findOne(id) {
        const found = await this.rolRepository.findOne({
            where: { id_rol: id },
            relations: ['usuario'],
        });
        if (!found)
            throw new common_1.NotFoundException(`Rol con ID ${id} no encontrado`);
        return found;
    }
    async remove(id) {
        const found = await this.findOne(id);
        try {
            return await this.rolRepository.remove(found);
        }
        catch (error) {
            throw new common_1.ConflictException('No se puede eliminar el rol porque tiene usuarios asignados.');
        }
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(roles_entity_1.rol)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], RolesService);
//# sourceMappingURL=roles.service.js.map