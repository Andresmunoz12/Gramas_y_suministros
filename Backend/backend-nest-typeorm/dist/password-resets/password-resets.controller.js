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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const password_resets_service_1 = require("./password-resets.service");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const Solicitar_codigo_dto_1 = require("./dto/Solicitar-codigo.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async solicitarCodigo(solicitarDto) {
        return this.authService.solicitarRecuperacion(solicitarDto.email);
    }
    async restablecerPassword(restablecerDto) {
        return this.authService.restablecerPassword(restablecerDto.codigo_verificacion, restablecerDto.nueva_password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('solicitar-codigo'),
    (0, swagger_1.ApiOperation)({ summary: 'Paso 1: Enviar código al correo' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Código enviado.',
        schema: { example: { message: 'Se ha enviado un código a tu correo' } },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Error al Enviar codigo',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-20T16:07:04.226Z',
                path: '/auth/solicitar-codigo',
                message: 'El correo no está registrado',
                errorName: 'NotFoundException',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Solicitar_codigo_dto_1.SolicitarCodigoDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "solicitarCodigo", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('restablecer-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Paso 2: Cambiar contraseña con el código' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Contraseña actualizada correctamente.',
        schema: {
            example: { message: 'Contraseña actualizada correctamente' },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Código inválido o contraseña muy corta.',
        schema: {
            example: {
                statusCode: 400,
                timestamp: '2026-03-20T16:11:49.841Z',
                path: '/auth/restablecer-password',
                message: 'Código inválido o ya usado',
                errorName: 'BadRequestException',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.RestablecerPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "restablecerPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Recuperar Contraseña'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [password_resets_service_1.AuthService])
], AuthController);
//# sourceMappingURL=password-resets.controller.js.map