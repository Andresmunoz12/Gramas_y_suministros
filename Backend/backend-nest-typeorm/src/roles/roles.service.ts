import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { rol } from './roles.entity';
import { CreateRolDto } from './dto/create-rol-dto';
import { UpdateRolDto } from './dto/update-rol-dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(rol)
    private readonly rolRepository: Repository<rol>,
  ) {}

  async create(createRolDto: CreateRolDto) {
    // Verificar si el tipo de rol ya está registrado en la BD
    const existe = await this.rolRepository.findOne({
      where: { tipo: createRolDto.tipo },
    });
    if (existe) {
      throw new ConflictException(
        `El rol de tipo ${createRolDto.tipo} ya existe.`,
      );
    }

    const nuevoRol = this.rolRepository.create(createRolDto);
    return await this.rolRepository.save(nuevoRol);
  }

  async findAll() {
    return await this.rolRepository.find({ relations: ['usuario'] });
  }
  async update(id: number, updateRolDto: UpdateRolDto) {
    // 1. Buscamos el rol para verificar que existe
    const rol = await this.findOne(id);

    // 2. Mezclamos los datos existentes con los nuevos (Preload es muy útil aquí)
    const rolActualizado = this.rolRepository.merge(rol, updateRolDto);

    // 3. Guardamos
    return await this.rolRepository.save(rolActualizado);
  }

  async findOne(id: number) {
    const found = await this.rolRepository.findOne({
      where: { id_rol: id },
      relations: ['usuario'],
    });
    if (!found) throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    return found;
  }

  async remove(id: number) {
    const found = await this.findOne(id);
    try {
      return await this.rolRepository.remove(found);
    } catch (error) {
      throw new ConflictException(
        'No se puede eliminar el rol porque tiene usuarios asignados.',
      );
    }
  }
}
