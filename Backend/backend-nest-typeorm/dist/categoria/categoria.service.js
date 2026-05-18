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
exports.CategoriaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const categoria_entity_1 = require("./categoria.entity");
let CategoriaService = class CategoriaService {
    categoriaRepository;
    constructor(categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }
    async create(createCategoriaDto) {
        const existe = await this.categoriaRepository.findOne({
            where: { nombre: createCategoriaDto.nombre },
        });
        if (existe) {
            throw new common_1.ConflictException(`La categoría '${createCategoriaDto.nombre}' ya existe.`);
        }
        const nuevaCategoria = this.categoriaRepository.create(createCategoriaDto);
        return await this.categoriaRepository.save(nuevaCategoria);
    }
    async findAll() {
        return await this.categoriaRepository.find({ relations: ['productos'] });
    }
    async findOne(id) {
        const found = await this.categoriaRepository.findOne({
            where: { id_categoria: id },
            relations: ['productos'],
        });
        if (!found) {
            throw new common_1.NotFoundException(`Categoría con ID ${id} no encontrada`);
        }
        return found;
    }
    async update(id, updateCategoriaDto) {
        const cat = await this.findOne(id);
        const actualizada = Object.assign(cat, updateCategoriaDto);
        return await this.categoriaRepository.save(actualizada);
    }
    async remove(id) {
        const cat = await this.findOne(id);
        try {
            return await this.categoriaRepository.remove(cat);
        }
        catch (error) {
            throw new common_1.ConflictException('No se puede eliminar la categoría porque tiene productos vinculados.');
        }
    }
};
exports.CategoriaService = CategoriaService;
exports.CategoriaService = CategoriaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(categoria_entity_1.categoria)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoriaService);
//# sourceMappingURL=categoria.service.js.map