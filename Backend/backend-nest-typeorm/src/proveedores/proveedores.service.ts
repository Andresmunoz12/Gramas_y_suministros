// proveedores/proveedores.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { proveedor } from './proveedores.entity';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(proveedor)
    private readonly repo: Repository<proveedor>,
  ) { }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const p = await this.repo.findOneBy({ id_proveedor: id });
    if (!p) throw new NotFoundException('Proveedor no encontrado');
    return p;
  }

  create(data: Partial<proveedor>) {
    return this.repo.save(this.repo.create(data));
  }
  // Dentro de la clase ProveedoresService
  async update(id: number, dto: UpdateProveedorDto) {
    await this.repo.update(id, dto);
    return this.findOne(id); // Retorna el proveedor actualizado
  }

  async remove(id: number) {
    const proveedor = await this.findOne(id);
    return await this.repo.remove(proveedor);
  }
}
