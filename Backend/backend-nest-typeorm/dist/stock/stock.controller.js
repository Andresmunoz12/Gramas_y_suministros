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
exports.StockController = void 0;
const common_1 = require("@nestjs/common");
const stock_service_1 = require("./stock.service");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let StockController = class StockController {
    stockService;
    constructor(stockService) {
        this.stockService = stockService;
    }
    async verTodo() {
        return await this.stockService.findAll();
    }
    async verUno(id) {
        return await this.stockService.findOne(id);
    }
};
exports.StockController = StockController;
__decorate([
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Consultar existencias de todos los productos' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de stock obtenida.',
        schema: {
            example: [
                { id_stock: 1, id_producto: 10, nombre: 'Grama Kukuyo', cantidad: 150 },
                {
                    id_stock: 2,
                    id_producto: 11,
                    nombre: 'Grama Japonesa',
                    cantidad: 80,
                },
            ],
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StockController.prototype, "verTodo", null);
__decorate([
    (0, roles_decorator_1.Roles)(1),
    (0, common_1.Get)(':id_producto'),
    (0, swagger_1.ApiOperation)({ summary: 'Ver stock disponible de un producto específico' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Stock encontrado.',
        schema: {
            example: {
                id_producto: 10,
                cantidad: 150,
                ultima_actualizacion: '2026-03-20',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Producto no encontrado en inventario.',
        schema: {
            example: {
                statusCode: 404,
                timestamp: '2026-03-20T20:17:03.976Z',
                path: '/stock/22',
                message: 'No se encontró registro de stock para el producto con ID 22',
                errorName: 'NotFoundException',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id_producto', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StockController.prototype, "verUno", null);
exports.StockController = StockController = __decorate([
    (0, swagger_1.ApiTags)('Gestión de Stock / Inventario'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('stock'),
    __metadata("design:paramtypes", [stock_service_1.StockService])
], StockController);
//# sourceMappingURL=stock.controller.js.map