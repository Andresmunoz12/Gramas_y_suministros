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
  let registro = await manager.findOne(stock, {
    where: { id_producto },
    lock: { mode: 'pessimistic_write' },
  });

  if (!registro) {
    // 👇 AGREGAR ultima_actualizacion
    registro = manager.create(stock, {
      id_producto,
      cantidad_actual: cantidad,
      nivel_minimo: 10,
      ultima_actualizacion: new Date(),  // 👈 ESTO FALTA
    });
  } else {
    registro.cantidad_actual =
      Number(registro.cantidad_actual) + Number(cantidad);
    registro.ultima_actualizacion = new Date();  // 👈 Actualizar también
  }
  return await manager.save(registro);
}

  // Configurar el nivel mínimo de stock para un producto
  async actualizarNivelMinimo(id_producto: number, nivel_minimo: number) {
    const registro = await this.stockRepo.findOne({
      where: { id_producto },
    });

    if (!registro) {
      throw new NotFoundException(
        `No se encontró registro de stock para el producto con ID ${id_producto}. Primero registre una entrada.`,
      );
    }

    registro.nivel_minimo = nivel_minimo;
    return await this.stockRepo.save(registro);
  }
}
