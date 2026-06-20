// src/reportes/reportes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';
import { productos } from '../productos/productos.entity';
import { stock } from '../stock/stock.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(usuario)
    private readonly userRepository: Repository<usuario>,
    @InjectRepository(productos)
    private readonly productRepository: Repository<productos>,
    @InjectRepository(stock)
    private readonly stockRepository: Repository<stock>,
  ) {}

  // Resumen general
  async getResumenGeneral() {
    const totalUsuarios = await this.userRepository.count();
    const totalProductos = await this.userRepository.count();
    
    const usuariosActivos = await this.userRepository.count({
      where: { estado: 'activo' }
    });

    const usuariosEnLinea = await this.userRepository.count({
      where: {
        ultimoLogin: Between(
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date()
        )
      }
    });

    const stockData = await this.stockRepository.find({
      relations: ['producto']
    });

    const totalStock = stockData.reduce((sum, item) => sum + (item.cantidad_actual || 0), 0);
    const productosSinStock = stockData.filter(item => item.cantidad_actual === 0).length;
    const productosStockBajo = stockData.filter(item => item.cantidad_actual <= item.nivel_minimo && item.cantidad_actual > 0).length;

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosEnLinea,
      totalProductos,
      totalStock,
      productosSinStock,
      productosStockBajo
    };
  }

  // Usuarios nuevos por rango de fechas
  async getUsuariosNuevos(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const usuarios = await this.userRepository.find({
      where: {
        createdAt: Between(inicio, fin)
      },
      order: { createdAt: 'ASC' }
    });

    // Agrupar por día
    const agrupado = this.agruparPorDia(usuarios, 'createdAt');
    
    return {
      total: usuarios.length,
      data: agrupado,
      detalle: usuarios
    };
  }

  // Productos nuevos por rango de fechas
  async getProductosNuevos(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const productos = await this.productRepository.find({
      where: {
        createdAt: Between(inicio, fin)
      },
      relations: ['categoria'],
      order: { createdAt: 'ASC' }
    });

    const agrupado = this.agruparPorDia(productos, 'createdAt');

    return {
      total: productos.length,
      data: agrupado,
      detalle: productos
    };
  }

  // Stock crítico (bajo stock y sin stock)
  async getStockCritico() {
    const stockData = await this.stockRepository.find({
      relations: ['producto'],
      order: { cantidad_actual: 'ASC' }
    });

    const sinStock = stockData.filter(item => item.cantidad_actual === 0);
    const bajoStock = stockData.filter(item => item.cantidad_actual <= item.nivel_minimo && item.cantidad_actual > 0);
    const normal = stockData.filter(item => item.cantidad_actual > item.nivel_minimo);

    return {
      sinStock: {
        total: sinStock.length,
        productos: sinStock.map(item => ({
          id: item.id_producto,
          nombre: item.producto?.nombre || 'Desconocido',
          stockActual: item.cantidad_actual,
          stockMinimo: item.nivel_minimo
        }))
      },
      bajoStock: {
        total: bajoStock.length,
        productos: bajoStock.map(item => ({
          id: item.id_producto,
          nombre: item.producto?.nombre || 'Desconocido',
          stockActual: item.cantidad_actual,
          stockMinimo: item.nivel_minimo
        }))
      },
      normal: {
        total: normal.length,
        productos: normal.map(item => ({
          id: item.id_producto,
          nombre: item.producto?.nombre || 'Desconocido',
          stockActual: item.cantidad_actual,
          stockMinimo: item.nivel_minimo
        }))
      }
    };
  }

  // Usuarios en línea (últimas 24h)
  async getUsuariosEnLinea() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const usuarios = await this.userRepository.find({
      where: {
        ultimoLogin: Between(hoy, new Date())
      },
      relations: ['rol']
    });

    return {
      total: usuarios.length,
      usuarios: usuarios.map(u => ({
        id: u.id_usuario,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol?.tipo,
        ultimoLogin: u.ultimoLogin
      }))
    };
  }

  // Helper: agrupar por día
  private agruparPorDia(data: any[], campoFecha: string) {
    const grupos = new Map<string, number>();
    
    data.forEach(item => {
      const fecha = new Date(item[campoFecha]);
      const clave = fecha.toISOString().split('T')[0];
      grupos.set(clave, (grupos.get(clave) || 0) + 1);
    });

    return Array.from(grupos.entries())
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}