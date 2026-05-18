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
exports.ProveedoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const proveedores_service_1 = require("./proveedores.service");
const create_proveedor_dto_1 = require("./dto/create-proveedor.dto");
const update_proveedor_dto_1 = require("./dto/update-proveedor.dto");
let ProveedoresController = class ProveedoresController {
    proveedoresService;
    constructor(proveedoresService) {
        this.proveedoresService = proveedoresService;
    }
    async crear(dto) {
        return await this.proveedoresService.create(dto);
    }
    async listar() {
        return await this.proveedoresService.findAll();
    }
    async obtenerUno(id) {
        return await this.proveedoresService.findOne(id);
    }
    async actualizar(id, dto) {
        return await this.proveedoresService.update(id, dto);
    }
    async borrar(id) {
        return await this.proveedoresService.remove(id);
    }
};
exports.ProveedoresController = ProveedoresController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo proveedor' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Proveedor creado correctamente.',
        schema: {
            example: {
                mensaje: 'Entrada de grama registrada exitosamente',
                id: 9,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'no autorizado',
        schema: {
            example: {
                statusCode: 403,
                message: 'No tienes permisos de Administrador',
                error: 'Forbidden',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Error en la validación de datos.',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-24T20:37:17.763Z',
                path: '/movimientos/entrada',
                message: 'Proveedor no encontrado',
                errorName: 'NotFoundException',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_proveedor_dto_1.CreateProveedorDto]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "crear", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos los proveedores' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista obtenida con éxito.',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-24T20:37:17.763Z',
                path: '/movimientos/entrada',
                message: 'Proveedor no encontrado',
                errorName: 'NotFoundException',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un proveedor por ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID numérico del proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Proveedor encontrado.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Proveedor no existe.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "obtenerUno", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de un proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Proveedor actualizado.' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_proveedor_dto_1.UpdateProveedorDto]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "actualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un proveedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Proveedor eliminado.' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'No se pudo eliminar: ID no encontrado.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProveedoresController.prototype, "borrar", null);
exports.ProveedoresController = ProveedoresController = __decorate([
    (0, swagger_1.ApiTags)('Proveedores'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('proveedores'),
    __metadata("design:paramtypes", [proveedores_service_1.ProveedoresService])
], ProveedoresController);
//# sourceMappingURL=proveedores.controller.js.map