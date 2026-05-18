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
exports.MovimientosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const movimiento_entity_1 = require("./movimiento.entity");
const entrada_entity_1 = require("./entrada.entity");
const salida_entity_1 = require("./salida.entity");
const stock_entity_1 = require("../stock/stock.entity");
const stock_service_1 = require("../stock/stock.service");
const productos_entity_1 = require("../productos/productos.entity");
const usuarios_entity_1 = require("../Usuarios/usuarios.entity");
const proveedores_entity_1 = require("../proveedores/proveedores.entity");
let MovimientosService = class MovimientosService {
    movRepo;
    entRepo;
    salRepo;
    prodRepo;
    userRepo;
    provRepo;
    stockService;
    dataSource;
    constructor(movRepo, entRepo, salRepo, prodRepo, userRepo, provRepo, stockService, dataSource) {
        this.movRepo = movRepo;
        this.entRepo = entRepo;
        this.salRepo = salRepo;
        this.prodRepo = prodRepo;
        this.userRepo = userRepo;
        this.provRepo = provRepo;
        this.stockService = stockService;
        this.dataSource = dataSource;
    }
    async registrarEntrada(dto) {
        const productoExistente = await this.prodRepo.findOne({ where: { id_producto: dto.id_producto } });
        if (!productoExistente)
            throw new common_1.NotFoundException('Producto no encontrado');
        const usuarioExistente = await this.userRepo.findOne({ where: { id_usuario: dto.id_usuario } });
        if (!usuarioExistente)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const proveedorExistente = await this.provRepo.findOne({ where: { id_proveedor: dto.id_proveedor } });
        if (!proveedorExistente)
            throw new common_1.NotFoundException('Proveedor no encontrado');
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const mov = await qr.manager.save(this.movRepo.create({
                id_producto: dto.id_producto,
                id_usuario: dto.id_usuario,
                cantidad: dto.cantidad,
                detalle: dto.detalle,
                tipo: 'entrada',
            }));
            await qr.manager.save(this.entRepo.create({
                id_movimiento: mov.id_movimiento,
                id_proveedor: dto.id_proveedor,
                precio_unitario: dto.precio_unitario,
                lote: dto.lote,
                observaciones: dto.observaciones,
            }));
            await this.stockService.actualizarSaldo(dto.id_producto, dto.cantidad, qr.manager);
            await qr.commitTransaction();
            return {
                mensaje: 'Entrada de grama registrada exitosamente',
                id: mov.id_movimiento,
            };
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async registrarSalida(dto) {
        const productoExistente = await this.prodRepo.findOne({ where: { id_producto: dto.id_producto } });
        if (!productoExistente)
            throw new common_1.NotFoundException('Producto no encontrado');
        const usuarioExistente = await this.userRepo.findOne({ where: { id_usuario: dto.id_usuario } });
        if (!usuarioExistente)
            throw new common_1.NotFoundException('Usuario no encontrado');
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const stockActual = await qr.manager.findOne(stock_entity_1.stock, {
                where: { id_producto: dto.id_producto },
            });
            if (!stockActual || stockActual.cantidad_actual < dto.cantidad) {
                throw new common_1.BadRequestException(`Stock insuficiente. Disponible: ${stockActual?.cantidad_actual || 0}`);
            }
            const mov = await qr.manager.save(this.movRepo.create({
                id_producto: dto.id_producto,
                id_usuario: dto.id_usuario,
                cantidad: dto.cantidad,
                detalle: dto.detalle,
                tipo: 'salida',
            }));
            await qr.manager.save(this.salRepo.create({
                id_movimiento: mov.id_movimiento,
                destino: dto.destino,
                motivo: dto.motivo,
                observaciones: dto.observaciones,
            }));
            await this.stockService.actualizarSaldo(dto.id_producto, -dto.cantidad, qr.manager);
            await qr.commitTransaction();
            return {
                mensaje: 'Salida de grama registrada exitosamente',
                id: mov.id_movimiento,
            };
        }
        catch (err) {
            await qr.rollbackTransaction();
            throw err;
        }
        finally {
            await qr.release();
        }
    }
    async findAll() {
        return await this.movRepo.find({
            relations: ['producto', 'usuario', 'entrada', 'salida'],
            order: { fecha: 'DESC' },
        });
    }
};
exports.MovimientosService = MovimientosService;
exports.MovimientosService = MovimientosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(movimiento_entity_1.movimiento)),
    __param(1, (0, typeorm_1.InjectRepository)(entrada_entity_1.entrada)),
    __param(2, (0, typeorm_1.InjectRepository)(salida_entity_1.salida)),
    __param(3, (0, typeorm_1.InjectRepository)(productos_entity_1.productos)),
    __param(4, (0, typeorm_1.InjectRepository)(usuarios_entity_1.usuario)),
    __param(5, (0, typeorm_1.InjectRepository)(proveedores_entity_1.proveedor)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        stock_service_1.StockService,
        typeorm_2.DataSource])
], MovimientosService);
//# sourceMappingURL=movimiento.service.js.map