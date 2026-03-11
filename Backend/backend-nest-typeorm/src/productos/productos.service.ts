import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { productos } from './productos.entity'; // Asegúrate que el nombre de la clase sea Producto
import { CreateProductoDto } from './dto/create-producto-dto';
import { categoria } from '../categoria/categoria.entity';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(productos)
    private readonly productoRepository: Repository<productos>,
    @InjectRepository(categoria)
    private readonly categoriaRepository: Repository<categoria>,
  ) {}

  // 1. CREAR PRODUCTO
  async create(createProductoDto: CreateProductoDto) {
    // Validar si la categoría existe
    const categoria = await this.categoriaRepository.findOne({
      where: { id_categoria: createProductoDto.id_categoria },
    });

    if (!categoria) {
      throw new NotFoundException(
        `La categoría con ID ${createProductoDto.id_categoria} no existe`,
      );
    }

    // Crear la instancia del producto
    const nuevoProducto = this.productoRepository.create({
      ...createProductoDto,
      categoria: categoria, // Asignamos el objeto categoría completo
    });

    return await this.productoRepository.save(nuevoProducto);
  }

  // 2. OBTENER TODOS LOS PRODUCTOS
  async findAll() {
    return await this.productoRepository.find({
      relations: ['categoria'], // Trae los datos de la categoría unida
    });
  }

  // 3. OBTENER UN PRODUCTO POR ID
  async findOne(id: number) {
    const producto = await this.productoRepository.findOne({
      where: { id_producto: id },
      relations: ['categoria'],
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  // 4. ACTUALIZAR PRODUCTO
  async update(id: number, updateProductoDto: UpdateProductoDto) {
    // Buscar si el producto existe
    const producto = await this.findOne(id);

    // Si viene una nueva categoría, validar que exista
    if (updateProductoDto.id_categoria) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id_categoria: updateProductoDto.id_categoria },
      });
      if (!categoria) {
        throw new NotFoundException(
          `Categoría con ID ${updateProductoDto.id_categoria} no encontrada`,
        );
      }
      producto.categoria = categoria; // Asignar nueva categoría
    }

    // Fusionar cambios (solo actualiza los campos enviados en el DTO)
    this.productoRepository.merge(producto, updateProductoDto);

    return await this.productoRepository.save(producto);
  }

  // 5. ELIMINAR PRODUCTO
  async remove(id: number) {
    const producto = await this.findOne(id);
    await this.productoRepository.remove(producto);
    return { mensaje: `Producto ${id} eliminado con éxito` };
  }
}
