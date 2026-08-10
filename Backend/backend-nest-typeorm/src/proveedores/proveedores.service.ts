import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { proveedor } from './proveedores.entity';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(proveedor)
    private readonly repo: Repository<proveedor>,
  ) {}

  async findAll() {
    return await this.repo.find({
      relations: ['entradas'],
    });
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({
      where: {
        id_proveedor: id,
      },
      relations: ['entradas'],
    });

    if (!p) {
      throw new NotFoundException(
        'Proveedor no encontrado',
      );
    }

    return p;
  }

  async create(data: Partial<proveedor>) {
    return await this.repo.save(
      this.repo.create(data),
    );
  }

  async update(
    id: number,
    dto: UpdateProveedorDto,
  ) {
    // Primero comprobar que existe
    await this.findOne(id);

    // Actualizar
    await this.repo.update(id, dto);

    // Devolver actualizado
    return await this.findOne(id);
  }

  async remove(id: number) {
    // Buscar proveedor junto con sus entradas
    const proveedor = await this.findOne(id);

    // Verificar si tiene entradas asociadas
    if (
      proveedor.entradas &&
      proveedor.entradas.length > 0
    ) {
      throw new ConflictException(
        'No se puede eliminar el proveedor porque tiene entradas asociadas.',
      );
    }

    return await this.repo.remove(proveedor);
  }
}