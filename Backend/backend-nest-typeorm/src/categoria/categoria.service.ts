import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
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

    const nuevaCategoria =
      this.categoriaRepository.create(createCategoriaDto);

    return await this.categoriaRepository.save(nuevaCategoria);
  }

  async findAll() {
    return await this.categoriaRepository.find({
      relations: ['productos'],
    });
  }

  async findOne(id: number) {
    const found = await this.categoriaRepository.findOne({
      where: { id_categoria: id },
      relations: ['productos'],
    });

    if (!found) {
      throw new NotFoundException(
        `Categoría con ID ${id} no encontrada`,
      );
    }

    return found;
  }

  async update(
    id: number,
    updateCategoriaDto: CreateCategoriaDto,
  ) {
    const cat = await this.findOne(id);

    if (updateCategoriaDto.nombre) {
      const existeDuplicado =
        await this.categoriaRepository.findOne({
          where: {
            nombre: updateCategoriaDto.nombre,
            id_categoria: Not(id),
          },
        });

      if (existeDuplicado) {
        throw new ConflictException(
          `La categoría '${updateCategoriaDto.nombre}' ya existe.`,
        );
      }
    }

    const actualizada = Object.assign(
      cat,
      updateCategoriaDto,
    );

    return await this.categoriaRepository.save(actualizada);
  }

  async remove(id: number) {
    const cat = await this.findOne(id);

    // No permitir eliminar categorías con productos
    if (cat.productos && cat.productos.length > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene productos vinculados.',
      );
    }

    return await this.categoriaRepository.remove(cat);
  }
}