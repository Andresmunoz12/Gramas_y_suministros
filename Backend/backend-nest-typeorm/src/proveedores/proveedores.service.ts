// src/proveedores/proveedores.service.ts

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

  // Nuevo método para verificar nombre duplicado
  private async verificarNombreUnico(nombre: string, idExcluir?: number) {
    const query = this.repo.createQueryBuilder('proveedor')
      .where('proveedor.nombre = :nombre', { nombre });

    if (idExcluir) {
      query.andWhere('proveedor.id_proveedor != :idExcluir', { idExcluir });
    }

    const existe = await query.getOne();

    if (existe) {
      throw new ConflictException(
        `El proveedor con nombre "${nombre}" ya existe`,
      );
    }
  }

  async create(data: Partial<proveedor>) {
    // Verificar que el nombre no exista
    if (data.nombre) {
      await this.verificarNombreUnico(data.nombre);
    }

    return await this.repo.save(
      this.repo.create(data),
    );
  }

  async update(
    id: number,
    dto: UpdateProveedorDto,
  ) {
    // Primero comprobar que existe
    const proveedorExistente = await this.findOne(id);

    // Verificar que el nombre no exista (excluyendo el proveedor actual)
    if (dto.nombre && dto.nombre !== proveedorExistente.nombre) {
      await this.verificarNombreUnico(dto.nombre, id);
    }

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