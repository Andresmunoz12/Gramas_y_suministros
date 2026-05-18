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
exports.UsuariosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const usuarios_service_1 = require("./usuarios.service");
const create_usurio_dto_1 = require("./dto/create-usurio-dto");
const update_usuario_dto_1 = require("./dto/update-usuario.dto");
let UsuariosController = class UsuariosController {
    usuariosService;
    constructor(usuariosService) {
        this.usuariosService = usuariosService;
    }
    crearUsuario(nuevousuario) {
        return this.usuariosService.crearUsuario(nuevousuario);
    }
    listarTodos() {
        return this.usuariosService.obtenerUsuarios();
    }
    actualizar(id, datos) {
        return this.usuariosService.actualizarUsuario(id, datos);
    }
    eliminar(id) {
        return this.usuariosService.eliminarUsuario(id);
    }
    cambiarEstado(id, estado) {
        const estadosValidos = ['activo', 'inactivo', 'suspendido'];
        if (!estadosValidos.includes(estado)) {
            throw new common_1.BadRequestException(`Estado no válido. Use: ${estadosValidos.join(', ')}`);
        }
        return this.usuariosService.cambiarEstado(id, estado);
    }
};
exports.UsuariosController = UsuariosController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo usuario (Registro público)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Usuario creado exitosamente.',
        schema: {
            example: {
                id_usuario: 1,
                nombre: 'Andres Felipe',
                apellido: 'Muñoz Lombana',
                email: 'prueba@gmail.com',
                id_rol: 1,
                mensaje: 'Registro completado con éxito',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Error de validación en los datos enviados.',
        schema: {
            example: {
                message: [
                    'email must be an email',
                    'password_hash must be longer than or equal to 8 characters',
                ],
                error: 'Bad Request',
                statusCode: 400,
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_usurio_dto_1.CreateUsuarioDto]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "crearUsuario", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener lista de todos los usuarios (Solo Admin)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de usuarios retornada.',
        schema: {
            example: [
                {
                    id_usuario: 1,
                    nombre: 'Andres',
                    email: 'admin@gramas.com',
                    id_rol: 1,
                },
                { id_usuario: 2, nombre: 'Juan', email: 'juan@gramas.com', id_rol: 2 },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'No autorizado.Token faltante o invalido',
        schema: {
            example: [
                {
                    statusCode: 401,
                    timestamp: '2026-03-18T00:08:50.305Z',
                    path: '/usuarios',
                    message: 'No tienes permiso para acceder a este recurso. Debes iniciar sesión.',
                    errorName: 'UnauthorizedException',
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido. Se requiere rol de Administrador para ver esta lista.',
        schema: {
            example: [
                {
                    statusCode: 403,
                    timestamp: '2026-03-18T00:16:02.206Z',
                    path: '/usuarios',
                    message: 'No tienes permisos suficientes para acceder a este recurso.',
                    errorName: 'ForbiddenException',
                },
            ],
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "listarTodos", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(2, 1),
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar datos de un usuario por ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Usuario actualizado.',
        schema: {
            example: {
                id_usuario: 1,
                nombre: 'Andres Modificado',
                email: 'admin@gramas.com',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'No encontrado.',
        schema: { example: { statusCode: 404, message: 'Usuario no existe' } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Prohibido. Se requiere rol de Administrador para ver esta lista.',
        schema: {
            example: [
                {
                    statusCode: 403,
                    timestamp: '2026-03-18T00:16:02.206Z',
                    path: '/usuarios',
                    message: 'No tienes permisos suficientes para acceder a este recurso.',
                    errorName: 'ForbiddenException',
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Datos enviados incorrectos.',
        schema: {
            example: { statusCode: 400, message: 'Error en los datos enviados.' },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_usuario_dto_1.UpdateUsuarioDto]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "actualizar", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar un usuario del sistema' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Usuario borrado.',
        schema: {
            example: { message: 'Usuario con ID 5 eliminado correctamente' },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Usuario no encontrado.',
        schema: {
            example: {
                mensaje: 'El usuario no existe',
                borrado: false,
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "eliminar", null);
__decorate([
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Patch)(':id/estado'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado (activo/inactivo/suspendido)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Estado cambiado.',
        schema: { example: { id_usuario: 1, nuevoEstado: 'inactivo' } },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('estado')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], UsuariosController.prototype, "cambiarEstado", null);
exports.UsuariosController = UsuariosController = __decorate([
    (0, swagger_1.ApiTags)('Usuarios'),
    (0, common_1.Controller)('usuarios'),
    __metadata("design:paramtypes", [usuarios_service_1.UsuariosService])
], UsuariosController);
//# sourceMappingURL=usuarios.controller.js.map