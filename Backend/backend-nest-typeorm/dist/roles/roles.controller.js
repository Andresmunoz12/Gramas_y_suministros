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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_service_1 = require("./roles.service");
const create_rol_dto_1 = require("./dto/create-rol-dto");
const update_rol_dto_1 = require("./dto/update-rol-dto");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    create(createRolDto) {
        return this.rolesService.create(createRolDto);
    }
    findAll() {
        return this.rolesService.findAll();
    }
    findOne(id) {
        return this.rolesService.findOne(id);
    }
    update(id, updateRolDto) {
        return this.rolesService.update(id, updateRolDto);
    }
    remove(id) {
        return this.rolesService.remove(id);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo tipo de rol' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Rol creado.',
        schema: {
            example: {
                id_rol: 3,
                tipo: 'almacenista',
                descripcion: 'Gestión de bodega',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos inválidos.',
        schema: {
            example: {
                statusCode: 400,
                message: ['El tipo debe ser administrador, cliente o almacenista'],
                error: 'Bad Request',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido.',
        schema: {
            example: {
                statusCode: 403,
                message: 'No tienes permisos de Administrador',
                error: 'Forbidden',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_rol_dto_1.CreateRolDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener todos los roles registrados' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de roles.',
        schema: {
            example: [
                { id_rol: 1, tipo: 'administrador' },
                { id_rol: 2, tipo: 'cliente' },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido.',
        schema: {
            example: {
                statusCode: 403,
                message: 'No tienes permisos de Administrador',
                error: 'Forbidden',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener un rol específico por su ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rol encontrado.',
        schema: {
            example: {
                id_rol: 1,
                tipo: 'administrador',
                descripcion: 'Acceso total',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido.',
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
        description: 'No existe.',
        schema: { example: { statusCode: 404, message: 'Rol no encontrado' } },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar la descripción o tipo de un rol' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rol actualizado.',
        schema: {
            example: {
                id_rol: 2,
                tipo: 'cliente',
                descripcion: 'Usuario final del sistema',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Error en el JSON enviado.',
        schema: {
            example: {
                statusCode: 400,
                message: 'Tipo de rol no permitido',
                error: 'Bad Request',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido.',
        schema: {
            example: {
                statusCode: 403,
                message: 'No tienes permisos de Administrador',
                error: 'Forbidden',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_rol_dto_1.UpdateRolDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un rol permanentemente' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rol eliminado.',
        schema: { example: { message: 'Rol eliminado correctamente', id: 3 } },
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
], RolesController.prototype, "remove", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles de Usuario'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Controller)('roles'),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map