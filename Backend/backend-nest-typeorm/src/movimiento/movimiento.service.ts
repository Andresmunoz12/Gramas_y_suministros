import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { movimiento } from './movimiento.entity';
import { entrada } from './entrada.entity';
import { salida } from './salida.entity';
import { stock } from '../stock/stock.entity'; // IMPORTANTE: Agregamos la entidad stock
import { StockService } from '../stock/stock.service';
import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';
import { productos } from '../productos/productos.entity';
import { usuario } from '../Usuarios/usuarios.entity';
import { proveedor } from '../proveedores/proveedores.entity';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(movimiento) private movRepo: Repository<movimiento>,
    @InjectRepository(entrada) private entRepo: Repository<entrada>,
    @InjectRepository(salida) private salRepo: Repository<salida>,
    @InjectRepository(productos) private prodRepo: Repository<productos>,
    @InjectRepository(usuario) private userRepo: Repository<usuario>,
    @InjectRepository(proveedor) private provRepo: Repository<proveedor>,
    private readonly stockService: StockService,
    private dataSource: DataSource,
  ) { }

  // 1. REGISTRAR ENTRADA
  async registrarEntrada(dto: CreateMovimientoEntradaDto) {
    // Validaciones previas
    const productoExistente = await this.prodRepo.findOne({ where: { id_producto: dto.id_producto } });
    if (!productoExistente) throw new NotFoundException('Producto no encontrado');

    const usuarioExistente = await this.userRepo.findOne({ where: { id_usuario: dto.id_usuario } });
    if (!usuarioExistente) throw new NotFoundException('Usuario no encontrado');

    const proveedorExistente = await this.provRepo.findOne({ where: { id_proveedor: dto.id_proveedor } });
    if (!proveedorExistente) throw new NotFoundException('Proveedor no encontrado');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Crear el Movimiento PADRE
      const mov = await qr.manager.save(
        this.movRepo.create({
          id_producto: dto.id_producto,
          id_usuario: dto.id_usuario,
          cantidad: dto.cantidad,
          detalle: dto.detalle,
          tipo: 'entrada',
        }),
      );

      // Crear la Entrada HIJA
      await qr.manager.save(
        this.entRepo.create({
          id_movimiento: mov.id_movimiento,
          id_proveedor: dto.id_proveedor,
          precio_unitario: dto.precio_unitario,
          lote: dto.lote,
          observaciones: dto.observaciones,
        }),
      );

      // Actualizar Stock (Sumar)
      await this.stockService.actualizarSaldo(
        dto.id_producto,
        dto.cantidad,
        qr.manager,
      );

      await qr.commitTransaction();
      return {
        mensaje: 'Entrada de grama registrada exitosamente',
        id: mov.id_movimiento,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // 2. REGISTRAR SALIDA
  async registrarSalida(dto: CreateMovimientoSalidaDto) {
    // Validaciones previas
    const productoExistente = await this.prodRepo.findOne({ where: { id_producto: dto.id_producto } });
    if (!productoExistente) throw new NotFoundException('Producto no encontrado');

    const usuarioExistente = await this.userRepo.findOne({ where: { id_usuario: dto.id_usuario } });
    if (!usuarioExistente) throw new NotFoundException('Usuario no encontrado');

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Validar Stock antes de proceder (Usamos qr.manager para asegurar consistencia)
      const stockActual = await qr.manager.findOne(stock, {
        where: { id_producto: dto.id_producto },
      });

      if (!stockActual || stockActual.cantidad_actual < dto.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockActual?.cantidad_actual || 0}`,
        );
      }

      // Crear el Movimiento PADRE
      const mov = await qr.manager.save(
        this.movRepo.create({
          id_producto: dto.id_producto,
          id_usuario: dto.id_usuario,
          cantidad: dto.cantidad,
          detalle: dto.detalle,
          tipo: 'salida',
        }),
      );

      // Crear la Salida HIJA
      await qr.manager.save(
        this.salRepo.create({
          id_movimiento: mov.id_movimiento,
          destino: dto.destino,
          motivo: dto.motivo,
          observaciones: dto.observaciones,
        }),
      );

      // Actualizar Stock (Restar enviando valor negativo)
      await this.stockService.actualizarSaldo(
        dto.id_producto,
        -dto.cantidad,
        qr.manager,
      );

      await qr.commitTransaction();
      return {
        mensaje: 'Salida de grama registrada exitosamente',
        id: mov.id_movimiento,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // 3. LISTAR HISTORIAL
  async findAll() {
    return await this.movRepo.find({
      relations: ['producto', 'usuario', 'entrada', 'salida'],
      order: { fecha: 'DESC' },
    });
  }
}
