import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { categoria } from './categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria-dto';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(categoria)
    private readonly categoriaRepository: Repository<categoria>,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    const existe = await this.categoriaRepository.findOne({
      where: { nombre: createCategoriaDto.nombre },
    });

    if (existe) {
      throw new ConflictException(
        `La categoría '${createCategoriaDto.nombre}' ya existe.`,
      );
    }

    const nuevaCategoria = this.categoriaRepository.create(createCategoriaDto);
    return await this.categoriaRepository.save(nuevaCategoria);
  }

  async findAll() {
    // Coincide con el nombre en la Entity
    return await this.categoriaRepository.find({ relations: ['productos'] });
  }

  async findOne(id: number) {
    const found = await this.categoriaRepository.findOne({
      where: { id_categoria: id },
      relations: ['productos'],
    });

    if (!found) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    return found;
  }

  async update(id: number, updateCategoriaDto: CreateCategoriaDto) {
    const cat = await this.findOne(id);
    const actualizada = Object.assign(cat, updateCategoriaDto);
    return await this.categoriaRepository.save(actualizada);
  }

  async remove(id: number) {
    const cat = await this.findOne(id);
    try {
      return await this.categoriaRepository.remove(cat);
    } catch (error) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos vinculados.',
      );
    }
  }
}
