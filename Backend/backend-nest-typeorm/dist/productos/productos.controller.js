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
exports.ProductosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const swagger_1 = require("@nestjs/swagger");
const productos_service_1 = require("./productos.service");
const create_producto_dto_1 = require("./dto/create-producto-dto");
const update_producto_dto_1 = require("./dto/update-producto.dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const storage = (0, multer_1.diskStorage)({
    destination: './uploads/img_products',
    filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = (0, path_1.extname)(file.originalname);
        const cleanName = file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        callback(null, `${uniqueSuffix}-${cleanName}`);
    },
});
let ProductosController = class ProductosController {
    productosService;
    constructor(productosService) {
        this.productosService = productosService;
    }
    async create(createProductoDto, file) {
        if (file) {
            createProductoDto.imagen = file.filename;
        }
        return this.productosService.create(createProductoDto);
    }
    findAll() {
        return this.productosService.findAll();
    }
    findAllAdmin() {
        return this.productosService.findAllAdmin();
    }
    findOne(id) {
        return this.productosService.findOne(id);
    }
    async desactivar(id) {
        return this.productosService.desactivar(id);
    }
    async activar(id) {
        return this.productosService.activar(id);
    }
    async update(id, updateProductoDto, file) {
        if (file) {
            updateProductoDto.imagen = file.filename;
        }
        return this.productosService.update(id, updateProductoDto);
    }
    remove(id) {
        return this.productosService.remove(id);
    }
};
exports.ProductosController = ProductosController;
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Post)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('imagen', { storage })),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar un nuevo producto' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Producto creado.',
        schema: {
            example: {
                id_producto: 101,
                nombre: 'Grama Pro',
                precio: 50000,
                id_categoria: 1,
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Error de validación.',
        schema: {
            example: {
                statusCode: 400,
                message: ['precio must be a number'],
                error: 'Bad Request',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'No autorizado para borrar.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Solo el administrador puede borrar roles',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_producto_dto_1.CreateProductoDto, Object]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener lista completa de productos' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista obtenida.',
        schema: {
            example: [{ id_producto: 1, nombre: 'Grama Estándar', precio: 30000 }],
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Get)('admin/all'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener todos los productos (incluyendo inactivos) para administración' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findAllAdmin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar producto por ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Producto encontrado.',
        schema: {
            example: {
                id_producto: 2,
                nombre: 'Grama Sintética Premium',
                marca: 'Evergreen',
                peso: '2.500',
                material: 'Polietileno',
                descripcion: 'Teclado mecánico switches red',
                precio: '89.99',
                altura: '3.50',
                categoria: {
                    id_categoria: 1,
                    nombre: 'kikuyo',
                    descripcion: 'nada',
                },
                imagen: 'https://imagen.com/grama.jpg',
                createdAt: '2026-03-06T00:29:20.000Z',
                updatedAt: '2026-03-20T16:54:55.000Z',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'No encontrado.',
        schema: {
            example: { statusCode: 404, message: 'El producto con ID 5 no existe' },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Patch)(':id/desactivar'),
    (0, swagger_1.ApiOperation)({ summary: 'Desactivar un producto (no se muestra en catálogo)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "desactivar", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Patch)(':id/activar'),
    (0, swagger_1.ApiOperation)({ summary: 'Activar un producto (se muestra en catálogo)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "activar", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('imagen', { storage })),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de un producto existente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Producto actualizado exitosamente.',
        schema: {
            example: { id_producto: 1, nombre: 'Grama Premium v2', precio: 48000 },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'No autorizado para borrar.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Solo el administrador puede borrar roles',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Producto no encontrado',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-20T16:50:16.395Z',
                path: '/productos/4',
                message: 'Producto con ID 4 no encontrado',
                errorName: 'NotFoundException',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos incorrectos en el JSON.',
        schema: {
            example: {
                statusCode: 400,
                timestamp: '2026-03-20T16:55:11.542Z',
                path: '/productos/2',
                message: 'Unexpected token \'w\', ..."  "peso": woeiusdf,\n"... is not valid JSON',
                errorName: 'BadRequestException',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_producto_dto_1.UpdateProductoDto, Object]),
    __metadata("design:returntype", Promise)
], ProductosController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar producto del sistema' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Eliminado.',
        schema: { example: { message: 'Producto eliminado correctamente', id: 5 } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Producto no encontrado.',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-20T16:57:48.074Z',
                path: '/productos/4',
                message: 'Producto con ID 4 no encontrado',
                errorName: 'NotFoundException',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'No autorizado para borrar.',
        schema: {
            example: {
                statusCode: 403,
                message: 'Solo el administrador puede borrar roles',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductosController.prototype, "remove", null);
exports.ProductosController = ProductosController = __decorate([
    (0, swagger_1.ApiTags)('Productos e Inventario'),
    (0, common_1.Controller)('productos'),
    __metadata("design:paramtypes", [productos_service_1.ProductosService])
], ProductosController);
//# sourceMappingURL=productos.controller.js.map