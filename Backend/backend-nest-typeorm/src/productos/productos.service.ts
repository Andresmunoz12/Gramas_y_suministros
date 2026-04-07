// src/productos/productos.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs-extra';
import { productos } from './productos.entity';
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

  async create(createProductoDto: CreateProductoDto) {
    const categoria = await this.categoriaRepository.findOne({
      where: { id_categoria: createProductoDto.id_categoria },
    });

    if (!categoria) {
      throw new NotFoundException(
        `La categoría con ID ${createProductoDto.id_categoria} no existe`,
      );
    }

    const nuevoProducto = this.productoRepository.create({
      ...createProductoDto,
      categoria: categoria,
      estado: createProductoDto.estado ?? 1, // Por defecto activo
    });

    return await this.productoRepository.save(nuevoProducto);
  }

  // ✅ MODIFICADO: Obtener SOLO productos activos para el catálogo público
  async findAll() {
    return await this.productoRepository.find({
      where: { estado: 1 }, // Solo activos
      relations: ['categoria'],
    });
  }

  // ✅ AGREGADO: Obtener TODOS los productos (incluyendo inactivos) para el panel de administración
  async findAllAdmin() {
    return await this.productoRepository.find({
      relations: ['categoria'],
      order: { estado: 'DESC', id_producto: 'ASC' }, // Activos primero
    });
  }

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

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);

    // Eliminar imagen anterior si se está actualizando
    if (updateProductoDto.imagen && producto.imagen) {
      const oldImagePath = join(process.cwd(), 'uploads', 'img_products', producto.imagen);
      if (await fs.pathExists(oldImagePath)) {
        await fs.remove(oldImagePath);
        console.log(`✅ Imagen anterior eliminada: ${producto.imagen}`);
      }
    }

    if (updateProductoDto.id_categoria) {
      const categoria = await this.categoriaRepository.findOne({
        where: { id_categoria: updateProductoDto.id_categoria },
      });
      if (!categoria) {
        throw new NotFoundException(
          `Categoría con ID ${updateProductoDto.id_categoria} no encontrada`,
        );
      }
      producto.categoria = categoria;
    }

    this.productoRepository.merge(producto, updateProductoDto);
    return await this.productoRepository.save(producto);
  }

  // ✅ AGREGADO: Método para desactivar producto
  async desactivar(id: number) {
    const producto = await this.findOne(id);
    producto.estado = 0;
    return await this.productoRepository.save(producto);
  }

  // ✅ AGREGADO: Método para activar producto
  async activar(id: number) {
    const producto = await this.findOne(id);
    producto.estado = 1;
    return await this.productoRepository.save(producto);
  }

  async remove(id: number) {
    const producto = await this.findOne(id);
    
    if (producto.imagen) {
      const imagePath = join(process.cwd(), 'uploads', 'img_products', producto.imagen);
      if (await fs.pathExists(imagePath)) {
        await fs.remove(imagePath);
        console.log(`✅ Imagen eliminada: ${producto.imagen}`);
      }
    }
    
    await this.productoRepository.remove(producto);
    return { mensaje: `Producto ${id} eliminado con éxito` };
  }
}