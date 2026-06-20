import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { stock } from './stock.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(stock)
    private readonly stockRepo: Repository<stock>,
  ) { }

  // Obtener todo el inventario
  async findAll() {
    return await this.stockRepo.find({
      relations: ['producto'],
      order: { id_producto: 'DESC' },
    });
  }

  // Buscar el stock de un producto específico
  async findOne(id_producto: number) {
    const registro = await this.stockRepo.findOne({
      where: { id_producto },
      relations: ['producto'],
    });

    if (!registro) {
      throw new NotFoundException(
        `No se encontró registro de stock para el producto con ID ${id_producto}`,
      );
    }

    return registro;
  }

  /**
   * Método que usará MovimientosService dentro de una transacción.
   * IMPORTANTE: Usamos 'manager' para asegurar que la actualización del stock
   * ocurra al mismo tiempo que se guarda el movimiento.
   */
  async actualizarSaldo(
    id_producto: number,
    cantidad: number,
    manager: EntityManager,
  ) {
    // Buscamos si ya existe el producto en la tabla de stock
    let registro = await manager.findOne(stock, {
      where: { id_producto },
      lock: { mode: 'pessimistic_write' }, // Opcional: evita que dos procesos actualicen el mismo stock a la vez
    });

    if (!registro) {
      // Si no existe, lo creamos (ej. primera vez que entra la Grama Kukuyo)
      registro = manager.create(stock, {
        id_producto,
        cantidad_actual: cantidad,
      });
    } else {
      // Si ya existe, sumamos (o restamos si la cantidad es negativa)
      // Aseguramos que la cantidad sea tratada como número
      registro.cantidad_actual =
        Number(registro.cantidad_actual) + Number(cantidad);
    }

    return await manager.save(registro);
  }
}
