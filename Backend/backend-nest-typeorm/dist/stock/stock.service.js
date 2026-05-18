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
exports.StockService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_entity_1 = require("./stock.entity");
let StockService = class StockService {
    stockRepo;
    constructor(stockRepo) {
        this.stockRepo = stockRepo;
    }
    async findAll() {
        return await this.stockRepo.find({
            relations: ['producto'],
            order: { id_producto: 'DESC' },
        });
    }
    async findOne(id_producto) {
        const registro = await this.stockRepo.findOne({
            where: { id_producto },
            relations: ['producto'],
        });
        if (!registro) {
            throw new common_1.NotFoundException(`No se encontró registro de stock para el producto con ID ${id_producto}`);
        }
        return registro;
    }
    async actualizarSaldo(id_producto, cantidad, manager) {
        let registro = await manager.findOne(stock_entity_1.stock, {
            where: { id_producto },
            lock: { mode: 'pessimistic_write' },
        });
        if (!registro) {
            registro = manager.create(stock_entity_1.stock, {
                id_producto,
                cantidad_actual: cantidad,
            });
        }
        else {
            registro.cantidad_actual =
                Number(registro.cantidad_actual) + Number(cantidad);
        }
        return await manager.save(registro);
    }
};
exports.StockService = StockService;
exports.StockService = StockService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_entity_1.stock)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StockService);
//# sourceMappingURL=stock.service.js.map