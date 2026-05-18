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
exports.MovimientoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const movimiento_service_1 = require("./movimiento.service");
const create_movimiento_entrada_dto_1 = require("./dto/create-movimiento-entrada.dto");
const create_movimiento_salida_dto_1 = require("./dto/create-movimiento-salida.dto");
let MovimientoController = class MovimientoController {
    movimientosService;
    constructor(movimientosService) {
        this.movimientosService = movimientosService;
    }
    async crearEntrada(dto) {
        return await this.movimientosService.registrarEntrada(dto);
    }
    async crearSalida(dto) {
        return await this.movimientosService.registrarSalida(dto);
    }
    async obtenerHistorial() {
        return await this.movimientosService.findAll();
    }
};
exports.MovimientoController = MovimientoController;
__decorate([
    (0, common_1.Post)('entrada'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar entrada (Requiere Token)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'se genero la entrada correctamente',
        schema: {
            example: {
                mensaje: 'Entrada de grama registrada exitosamente',
                id: 10,
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
        description: 'provedor no encontrado',
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
    __metadata("design:paramtypes", [create_movimiento_entrada_dto_1.CreateMovimientoEntradaDto]),
    __metadata("design:returntype", Promise)
], MovimientoController.prototype, "crearEntrada", null);
__decorate([
    (0, common_1.Post)('salida'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar salida (Requiere Token)' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'se genero la salida correctamente',
        schema: {
            example: {
                mensaje: 'salida de grama registrada exitosamente',
                id: 10,
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
        description: 'provedor no encontrado',
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
    __metadata("design:paramtypes", [create_movimiento_salida_dto_1.CreateMovimientoSalidaDto]),
    __metadata("design:returntype", Promise)
], MovimientoController.prototype, "crearSalida", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Ver historial (Requiere Token)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MovimientoController.prototype, "obtenerHistorial", null);
exports.MovimientoController = MovimientoController = __decorate([
    (0, swagger_1.ApiTags)('Movimientos'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('movimientos'),
    __metadata("design:paramtypes", [movimiento_service_1.MovimientosService])
], MovimientoController);
//# sourceMappingURL=movimiento.controller.js.map