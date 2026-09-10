// src/reportes/reportes.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';
import { productos } from '../productos/productos.entity';
import { stock } from '../stock/stock.entity';
import { movimiento } from '../movimiento/movimiento.entity';
import { Cotizacion } from '../cotizaciones/cotizacion.entity';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(usuario)
    private userRepository: Repository<usuario>,
    @InjectRepository(productos)
    private productRepository: Repository<productos>,
    @InjectRepository(stock)
    private stockRepository: Repository<stock>,
    @InjectRepository(movimiento)
    private movimientoRepository: Repository<movimiento>,
    @InjectRepository(Cotizacion)
    private cotizacionRepository: Repository<Cotizacion>,
  ) {}

  // ============ DASHBOARD ============
  async getDashboard() {
    const totalUsuarios = await this.userRepository.count();
    const usuariosActivos = await this.userRepository.count({
      where: { estado: 'activo' },
    });

    const totalProductos = await this.productRepository.count();
    const productosActivos = await this.productRepository.count({
      where: { estado: 1 },
    });

    const stockData = await this.stockRepository.find();
    const productosConStock = stockData.filter((item) => item.cantidad_actual > 0).length;
    const sinStock = stockData.filter((item) => item.cantidad_actual === 0).length;
    const stockBajo = stockData.filter(
      (item) => item.cantidad_actual <= item.nivel_minimo && item.cantidad_actual > 0,
    ).length;
    const stockNormal = productosConStock - stockBajo;

    const cotizacionesPendientes = await this.cotizacionRepository.count({
      where: { estado: 'pendiente' },
    });

    const ventasMes = await this.cotizacionRepository
      .createQueryBuilder('c')
      .select('SUM(c.total)', 'total')
      .where('c.estado IN (:...estados)', { estados: ['pagado', 'entregado'] })
      .andWhere('MONTH(c.fechaCreacion) = MONTH(CURRENT_DATE())')
      .andWhere('YEAR(c.fechaCreacion) = YEAR(CURRENT_DATE())')
      .getRawOne();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const usuariosEnLinea = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('u.ultimoLogin >= :hoy', { hoy })
      .andWhere('u.estado = :estado', { estado: 'activo' })
      .orderBy('u.ultimoLogin', 'DESC')
      .getMany();

    const usuariosNuevos = await this.getUsuariosNuevosPorDia(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const productosNuevos = await this.getProductosNuevosPorDia(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const ventasDiarias = await this.getVentasDiarias(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const fechas = new Set();
    usuariosNuevos.data.forEach(item => fechas.add(item.fecha));
    productosNuevos.data.forEach(item => fechas.add(item.fecha));

    const comparativoNuevos = Array.from(fechas).sort().map(fecha => ({
      fecha,
      usuarios: usuariosNuevos.data.find(u => u.fecha === fecha)?.cantidad || 0,
      productos: productosNuevos.data.find(p => p.fecha === fecha)?.cantidad || 0,
    }));

    const ultimosUsuarios = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .orderBy('u.createdAt', 'DESC')
      .limit(5)
      .getMany();

    const ultimosProductos = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'categoria')
      .orderBy('p.createdAt', 'DESC')
      .limit(5)
      .getMany();

    return {
      usuarios: { total: totalUsuarios, activos: usuariosActivos },
      productos: { total: totalProductos, activos: productosActivos },
      stock: {
        total: stockData.length,
        normal: stockNormal,
        stockBajo: stockBajo,
        sinStock: sinStock,
      },
      cotizaciones: { pendientes: cotizacionesPendientes },
      ventasMes: Number(ventasMes?.total || 0),
      usuariosEnLinea: {
        total: usuariosEnLinea.length,
        usuarios: usuariosEnLinea.map(u => ({
          id: u.id_usuario,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol?.tipo || 'Sin rol',
          ultimoLogin: u.ultimoLogin,
        })),
      },
      usuariosNuevos,
      productosNuevos,
      ventasDiarias,
      comparativoNuevos,
      ultimosUsuarios: ultimosUsuarios.map(u => ({
        id: u.id_usuario,
        nombre: u.nombre,
        email: u.email,
        rol: u.rol?.tipo || 'Sin rol',
        fechaRegistro: u.createdAt,
      })),
      ultimosProductos: ultimosProductos.map(p => ({
        id: p.id_producto,
        nombre: p.nombre,
        precio: p.precio,
        categoria: p.categoria?.nombre || 'Sin categoría',
        fechaRegistro: p.createdAt,
      })),
    };
  }

  // ============ USUARIOS ============
  async getResumenUsuarios(filtros: { fechaInicio?: string; fechaFin?: string; estado?: string }) {
    const where: any = {};
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.fechaInicio && filtros.fechaFin) {
      where.createdAt = Between(
        new Date(filtros.fechaInicio),
        new Date(filtros.fechaFin),
      );
    }

    const usuarios = await this.userRepository.find({
      where,
      relations: ['rol'],
    });

    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.estado === 'activo').length;
    const inactivos = usuarios.filter((u) => u.estado === 'inactivo').length;
    const suspendidos = usuarios.filter((u) => u.estado === 'suspendido').length;

    const porRol = usuarios.reduce((acc, u) => {
      const rol = u.rol?.tipo || 'sin rol';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      activos,
      inactivos,
      suspendidos,
      porRol,
      usuarios: usuarios.map((u) => ({
        id: u.id_usuario,
        nombre: u.nombre,
        email: u.email,
        estado: u.estado,
        rol: u.rol?.tipo,
        fechaRegistro: u.createdAt,
        ultimoLogin: u.ultimoLogin,
      })),
    };
  }

  async getUsuariosNuevosPorDia(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const usuarios = await this.userRepository.find({
      where: { createdAt: Between(inicio, fin) },
      order: { createdAt: 'ASC' },
    });

    const agrupado = this.agruparPorDia(usuarios, 'createdAt');
    return {
      total: usuarios.length,
      data: agrupado,
    };
  }

  async getUsuariosPorRol() {
    const usuarios = await this.userRepository.find({
      relations: ['rol'],
    });

    const porRol = usuarios.reduce((acc, u) => {
      const rol = u.rol?.tipo || 'sin rol';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(porRol).map(([nombre, valor]) => ({ nombre, valor }));
  }

  // ============ PRODUCTOS ============
  async getResumenProductos(filtros: { categoria?: string; estado?: string }) {
    const query = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.categoria', 'c');

    if (filtros.categoria) {
      query.andWhere('c.nombre = :categoria', { categoria: filtros.categoria });
    }
    if (filtros.estado) {
      query.andWhere('p.estado = :estado', { estado: parseInt(filtros.estado) });
    }

    const productos = await query.getMany();
    const total = productos.length;
    const activos = productos.filter((p) => p.estado === 1).length;
    const inactivos = productos.filter((p) => p.estado === 0).length;

    const stockData = await this.stockRepository.find();
    const conStock = stockData.filter((s) => s.cantidad_actual > 0).length;
    const sinStock = stockData.filter((s) => s.cantidad_actual === 0).length;

    const porCategoria = productos.reduce((acc, p) => {
      const cat = p.categoria?.nombre || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoriasArray = Object.entries(porCategoria).map(([nombre, valor]) => ({
      nombre,
      valor,
    }));

    return {
      total,
      activos,
      inactivos,
      conStock,
      sinStock,
      porCategoria: categoriasArray,
      productos: productos.map((p) => ({
        id: p.id_producto,
        nombre: p.nombre,
        precio: p.precio,
        estado: p.estado,
        categoria: p.categoria?.nombre,
        stock: stockData.find((s) => s.id_producto === p.id_producto)?.cantidad_actual || 0,
        fechaRegistro: p.createdAt,
      })),
    };
  }

  async getProductosNuevosPorDia(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const productos = await this.productRepository.find({
      where: { createdAt: Between(inicio, fin) },
      order: { createdAt: 'ASC' },
    });

    const agrupado = this.agruparPorDia(productos, 'createdAt');
    return {
      total: productos.length,
      data: agrupado,
    };
  }

  async getProductosPorCategoria() {
    const productos = await this.productRepository.find({
      relations: ['categoria'],
    });

    const porCategoria = productos.reduce((acc, p) => {
      const cat = p.categoria?.nombre || 'Sin categoría';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(porCategoria).map(([nombre, valor]) => ({ nombre, valor }));
  }

  async getEstadoStock() {
    const stockData = await this.stockRepository.find({
      relations: ['producto'],
    });

    const sinStock = stockData.filter((s) => s.cantidad_actual === 0).length;
    const bajoStock = stockData.filter(
      (s) => s.cantidad_actual <= s.nivel_minimo && s.cantidad_actual > 0,
    ).length;
    const normal = stockData.filter(
      (s) => s.cantidad_actual > s.nivel_minimo,
    ).length;

    return {
      sinStock,
      bajoStock,
      normal,
      total: stockData.length,
      detalle: stockData.map((s) => ({
        id: s.id_producto,
        producto: s.producto?.nombre || 'Desconocido',
        stock: s.cantidad_actual,
        minimo: s.nivel_minimo,
        estado: s.cantidad_actual === 0 ? 'Sin stock' : s.cantidad_actual <= s.nivel_minimo ? 'Stock bajo' : 'Normal',
      })),
    };
  }

  // ============ STOCK Y MOVIMIENTOS ============
  async getResumenStock() {
    const stockData = await this.stockRepository.find({
      relations: ['producto'],
    });

    const totalItems = stockData.length;
    const totalStock = stockData.reduce((sum, s) => sum + s.cantidad_actual, 0);
    const sinStock = stockData.filter((s) => s.cantidad_actual === 0).length;
    const bajoStock = stockData.filter(
      (s) => s.cantidad_actual <= s.nivel_minimo && s.cantidad_actual > 0,
    ).length;

    const productosMasStock = [...stockData]
      .sort((a, b) => b.cantidad_actual - a.cantidad_actual)
      .slice(0, 10)
      .map((s) => ({
        nombre: s.producto?.nombre || 'Desconocido',
        stock: s.cantidad_actual,
      }));

    return {
      totalItems,
      totalStock,
      sinStock,
      bajoStock,
      productosMasStock,
    };
  }

  async getMovimientos(filtros: { fechaInicio?: string; fechaFin?: string; tipo?: string }) {
    const query = this.movimientoRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.producto', 'producto')
      .leftJoinAndSelect('m.usuario', 'usuario');

    if (filtros.tipo) {
      query.andWhere('m.tipo = :tipo', { tipo: filtros.tipo });
    }
    if (filtros.fechaInicio && filtros.fechaFin) {
      query.andWhere('m.fecha >= :inicio', { inicio: new Date(filtros.fechaInicio) });
      query.andWhere('m.fecha <= :fin', { fin: new Date(filtros.fechaFin) });
    }

    const movimientos = await query.orderBy('m.fecha', 'DESC').getMany();

    return {
      total: movimientos.length,
      entradas: movimientos.filter((m) => m.tipo === 'entrada').length,
      salidas: movimientos.filter((m) => m.tipo === 'salida').length,
      movimientos: movimientos.map((m) => ({
        id: m.id_movimiento,
        producto: m.producto?.nombre || 'Desconocido',
        tipo: m.tipo,
        cantidad: m.cantidad,
        fecha: m.fecha,
        usuario: m.usuario?.nombre || 'Sistema',
        detalle: m.detalle,
      })),
    };
  }

  async getMovimientosPorDia(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const movimientos = await this.movimientoRepository.find({
      where: { fecha: Between(inicio, fin) },
      order: { fecha: 'ASC' },
    });

    const agrupado = this.agruparPorDia(movimientos, 'fecha');
    return {
      total: movimientos.length,
      data: agrupado,
    };
  }

  // ============ COTIZACIONES ============
  async getResumenCotizaciones(filtros: { fechaInicio?: string; fechaFin?: string; estado?: string }) {
    console.log('📊 Filtros de cotizaciones:', filtros);

    const query = this.cotizacionRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.usuario', 'usuario')
      .leftJoinAndSelect('c.detalles', 'detalles');

    if (filtros.estado) {
      query.andWhere('c.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.fechaInicio && filtros.fechaFin) {
      query.andWhere('c.fechaCreacion >= :inicio', { inicio: new Date(filtros.fechaInicio) });
      query.andWhere('c.fechaCreacion <= :fin', { fin: new Date(filtros.fechaFin) });
    }

    const cotizaciones = await query
      .orderBy('c.fechaCreacion', 'DESC')
      .getMany();

    const total = cotizaciones.length;
    const pendiente = cotizaciones.filter((c) => c.estado === 'pendiente').length;
    const pagado = cotizaciones.filter((c) => c.estado === 'pagado').length;
    const entregado = cotizaciones.filter((c) => c.estado === 'entregado').length;
    const cancelado = cotizaciones.filter((c) => c.estado === 'cancelado').length;

    const totalVentas = cotizaciones
      .filter((c) => c.estado === 'pagado' || c.estado === 'entregado')
      .reduce((sum, c) => sum + Number(c.total), 0);

    const cotizacionesDetalle = cotizaciones.map((c) => ({
      id: c.idCotizacion,
      cliente: c.usuario?.nombre || c.usuario?.email || 'Anónimo',
      email: c.usuario?.email || '',
      total: Number(c.total),
      estado: c.estado,
      metodoVenta: c.metodoVenta,
      metodoPago: c.metodoPago,
      fecha: c.fechaCreacion,
      items: c.detalles?.length || 0,
    }));

    return {
      total,
      pendiente,
      pagado,
      entregado,
      cancelado,
      totalVentas,
      cotizaciones: cotizacionesDetalle,
    };
  }

  async getCotizacionesPorMetodo() {
    const cotizaciones = await this.cotizacionRepository.find();
    const porMetodo = cotizaciones.reduce((acc, c) => {
      const metodo = c.metodoVenta || 'desconocido';
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(porMetodo).map(([nombre, valor]) => ({ nombre, valor }));
  }

  async getVentasDiarias(fechaInicio: string, fechaFin: string) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const cotizaciones = await this.cotizacionRepository.find({
      where: {
        estado: 'pagado',
        fechaCreacion: Between(inicio, fin),
      },
      order: { fechaCreacion: 'ASC' },
    });

    const agrupado = this.agruparPorDiaConTotal(cotizaciones, 'fechaCreacion');
    return {
      totalVentas: cotizaciones.reduce((sum, c) => sum + Number(c.total), 0),
      data: agrupado,
    };
  }

  // ============ EXPORTACIONES ============

  /**
   * EXPORTAR EXCEL - Diseño profesional con múltiples hojas
   */
  async exportarExcel() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gramas y Suministros';
    workbook.created = new Date();

    // Obtener datos
    const [usuarios, productos, stockData, cotizaciones, movimientos] = await Promise.all([
      this.userRepository.find({ relations: ['rol'] }),
      this.productRepository.find({ relations: ['categoria'] }),
      this.stockRepository.find({ relations: ['producto'] }),
      this.cotizacionRepository.find({ relations: ['usuario', 'detalles'] }),
      this.movimientoRepository.find({ relations: ['producto', 'usuario'] }),
    ]);

    // ========== HOJA 1: DASHBOARD ==========
    const dashSheet = workbook.addWorksheet('📊 Dashboard', {
      properties: { tabColor: { argb: '2E7D32' } },
    });

    // Título
    dashSheet.mergeCells('A1:D1');
    const titleCell = dashSheet.getCell('A1');
    titleCell.value = 'GRAMAS Y SUMINISTROS - REPORTE GENERAL';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dashSheet.getRow(1).height = 35;

    // Subtítulo con fecha
    dashSheet.mergeCells('A2:D2');
    const dateCell = dashSheet.getCell('A2');
    dateCell.value = `Generado el ${new Date().toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })}`;
    dateCell.font = { size: 10, italic: true, color: { argb: '666666' } };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dashSheet.getRow(2).height = 20;

    dashSheet.addRow([]);

    // Encabezados de tabla resumen
    const headerRow = dashSheet.addRow(['MÓDULO', 'TOTAL', 'ACTIVOS', 'INACTIVOS']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    dashSheet.getRow(headerRow.number).height = 25;

    // Datos de resumen
    const resumen = [
      {
        modulo: 'Usuarios',
        total: usuarios.length,
        activos: usuarios.filter((u) => u.estado === 'activo').length,
        inactivos: usuarios.filter((u) => u.estado !== 'activo').length,
      },
      {
        modulo: 'Productos',
        total: productos.length,
        activos: productos.filter((p) => p.estado === 1).length,
        inactivos: productos.filter((p) => p.estado === 0).length,
      },
      {
        modulo: 'Stock',
        total: stockData.length,
        activos: stockData.filter((s) => s.cantidad_actual > 0).length,
        inactivos: stockData.filter((s) => s.cantidad_actual === 0).length,
      },
      {
        modulo: 'Cotizaciones',
        total: cotizaciones.length,
        activos: cotizaciones.filter((c) => c.estado === 'pagado' || c.estado === 'entregado').length,
        inactivos: cotizaciones.filter((c) => c.estado === 'pendiente' || c.estado === 'cancelado').length,
      },
      {
        modulo: 'Movimientos',
        total: movimientos.length,
        activos: movimientos.filter((m) => m.tipo === 'entrada').length,
        inactivos: movimientos.filter((m) => m.tipo === 'salida').length,
      },
    ];

    resumen.forEach((item) => {
      const row = dashSheet.addRow([item.modulo, item.total, item.activos, item.inactivos]);
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber === 1) {
          cell.font = { bold: true };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    dashSheet.addRow([]);
    dashSheet.addRow([]);

    // Totales destacados
    const totalVentas = cotizaciones
      .filter((c) => c.estado === 'pagado' || c.estado === 'entregado')
      .reduce((sum, c) => sum + Number(c.total), 0);

    const totalsRow = dashSheet.addRow(['VENTAS TOTALES', totalVentas]);
    totalsRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    totalsRow.getCell(2).font = { bold: true, size: 12, color: { argb: 'FFFFFF' } };
    totalsRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
    totalsRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E7D32' } };
    totalsRow.getCell(2).numFmt = '"$"#,##0';
    totalsRow.getCell(2).alignment = { horizontal: 'right' };

    dashSheet.columns = [
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 20 },
    ];

    // ========== HOJA 2: USUARIOS ==========
    const userSheet = workbook.addWorksheet('👥 Usuarios', {
      properties: { tabColor: { argb: '1976D2' } },
    });

    userSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 25 },
      { header: 'Apellido', key: 'apellido', width: 25 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Rol', key: 'rol', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Registro', key: 'fechaRegistro', width: 20 },
      { header: 'Último Login', key: 'ultimoLogin', width: 20 },
    ];

    // Estilo de cabecera
    userSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1976D2' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    userSheet.getRow(1).height = 25;

    usuarios.forEach((u) => {
      const row = userSheet.addRow({
        id: u.id_usuario,
        nombre: u.nombre,
        apellido: u.apellido || '-',
        email: u.email,
        rol: u.rol?.tipo || 'Sin rol',
        estado: u.estado,
        fechaRegistro: u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CO') : '-',
        ultimoLogin: u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleString('es-CO') : 'Nunca',
      });

      // Colorear según estado
      const estadoCell = row.getCell('estado');
      if (u.estado === 'activo') {
        estadoCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else if (u.estado === 'inactivo') {
        estadoCell.font = { color: { argb: 'F57C00' }, bold: true };
      } else {
        estadoCell.font = { color: { argb: 'D32F2F' }, bold: true };
      }
    });

    // ========== HOJA 3: PRODUCTOS ==========
    const prodSheet = workbook.addWorksheet('📦 Productos', {
      properties: { tabColor: { argb: 'F57C00' } },
    });

    prodSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Marca', key: 'marca', width: 20 },
      { header: 'Precio', key: 'precio', width: 15 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Fecha Registro', key: 'fechaRegistro', width: 20 },
    ];

    prodSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F57C00' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    prodSheet.getRow(1).height = 25;

    productos.forEach((p) => {
      const stockItem = stockData.find((s) => s.id_producto === p.id_producto);
      const row = prodSheet.addRow({
        id: p.id_producto,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'Sin categoría',
        marca: p.marca || '-',
        precio: Number(p.precio),
        stock: stockItem?.cantidad_actual || 0,
        estado: p.estado === 1 ? 'Activo' : 'Inactivo',
        fechaRegistro: p.createdAt ? new Date(p.createdAt).toLocaleDateString('es-CO') : '-',
      });

      row.getCell('precio').numFmt = '"$"#,##0';

      const estadoCell = row.getCell('estado');
      if (p.estado === 1) {
        estadoCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else {
        estadoCell.font = { color: { argb: 'D32F2F' }, bold: true };
      }
    });

    // ========== HOJA 4: STOCK ==========
    const stockSheet = workbook.addWorksheet('📈 Stock', {
      properties: { tabColor: { argb: '9C27B0' } },
    });

    stockSheet.columns = [
      { header: 'ID Producto', key: 'id', width: 12 },
      { header: 'Producto', key: 'producto', width: 30 },
      { header: 'Stock Actual', key: 'stock', width: 15 },
      { header: 'Stock Mínimo', key: 'minimo', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Última Actualización', key: 'ultimaActualizacion', width: 22 },
    ];

    stockSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '9C27B0' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    stockSheet.getRow(1).height = 25;

    stockData.forEach((s) => {
      const estado = s.cantidad_actual === 0 ? 'Sin stock' :
                    s.cantidad_actual <= s.nivel_minimo ? 'Stock bajo' : 'Normal';

      const row = stockSheet.addRow({
        id: s.id_producto,
        producto: s.producto?.nombre || 'Desconocido',
        stock: s.cantidad_actual,
        minimo: s.nivel_minimo,
        estado: estado,
        ultimaActualizacion: s.ultima_actualizacion ? new Date(s.ultima_actualizacion).toLocaleString('es-CO') : '-',
      });

      const estadoCell = row.getCell('estado');
      if (estado === 'Normal') {
        estadoCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else if (estado === 'Stock bajo') {
        estadoCell.font = { color: { argb: 'F57C00' }, bold: true };
      } else {
        estadoCell.font = { color: { argb: 'D32F2F' }, bold: true };
      }
    });

    // ========== HOJA 5: COTIZACIONES ==========
    const cotSheet = workbook.addWorksheet('💰 Cotizaciones', {
      properties: { tabColor: { argb: 'D32F2F' } },
    });

    cotSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Método Venta', key: 'metodoVenta', width: 18 },
      { header: 'Items', key: 'items', width: 10 },
      { header: 'Fecha', key: 'fecha', width: 20 },
    ];

    cotSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D32F2F' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    cotSheet.getRow(1).height = 25;

    cotizaciones.forEach((c) => {
      const row = cotSheet.addRow({
        id: c.idCotizacion,
        cliente: c.usuario?.nombre || c.usuario?.email || 'Anónimo',
        email: c.usuario?.email || '-',
        total: Number(c.total),
        estado: c.estado,
        metodoVenta: c.metodoVenta === 'fisico' ? 'Punto físico' : 'Entrega',
        items: c.detalles?.length || 0,
        fecha: c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-CO') : '-',
      });

      row.getCell('total').numFmt = '"$"#,##0';

      const estadoCell = row.getCell('estado');
      if (c.estado === 'pagado') {
        estadoCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else if (c.estado === 'pendiente') {
        estadoCell.font = { color: { argb: 'F57C00' }, bold: true };
      } else if (c.estado === 'entregado') {
        estadoCell.font = { color: { argb: '1976D2' }, bold: true };
      } else {
        estadoCell.font = { color: { argb: 'D32F2F' }, bold: true };
      }
    });

    // ========== HOJA 6: MOVIMIENTOS ==========
    const movSheet = workbook.addWorksheet('🔄 Movimientos', {
      properties: { tabColor: { argb: '00897B' } },
    });

    movSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Producto', key: 'producto', width: 30 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 12 },
      { header: 'Usuario', key: 'usuario', width: 25 },
      { header: 'Detalle', key: 'detalle', width: 40 },
      { header: 'Fecha', key: 'fecha', width: 20 },
    ];

    movSheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00897B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    movSheet.getRow(1).height = 25;

    movimientos.forEach((m) => {
      const row = movSheet.addRow({
        id: m.id_movimiento,
        producto: m.producto?.nombre || 'Desconocido',
        tipo: m.tipo === 'entrada' ? '⬇️ Entrada' : '⬆️ Salida',
        cantidad: m.cantidad,
        usuario: m.usuario?.nombre || 'Sistema',
        detalle: m.detalle || '-',
        fecha: m.fecha ? new Date(m.fecha).toLocaleString('es-CO') : '-',
      });

      const tipoCell = row.getCell('tipo');
      if (m.tipo === 'entrada') {
        tipoCell.font = { color: { argb: '2E7D32' }, bold: true };
      } else {
        tipoCell.font = { color: { argb: 'D32F2F' }, bold: true };
      }
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * EXPORTAR PDF - Diseño profesional y detallado
   */
  async exportarPDF(res: Response) {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte_${new Date().toISOString().split('T')[0]}.pdf`,
    );

    doc.pipe(res);

    // Colores corporativos
    const verdePrincipal = '#2e7d32';
    const verdeOscuro = '#1b5e20';
    const verdeClaro = '#e8f5e9';
    const grisOscuro = '#333333';
    const grisClaro = '#f5f5f5';
    const grisTexto = '#666666';

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // Obtener datos
    const [usuarios, productos, stockData, cotizaciones, movimientos] = await Promise.all([
      this.userRepository.find({ relations: ['rol'] }),
      this.productRepository.find({ relations: ['categoria'] }),
      this.stockRepository.find({ relations: ['producto'] }),
      this.cotizacionRepository.find({ relations: ['usuario', 'detalles'] }),
      this.movimientoRepository.find({ relations: ['producto', 'usuario'] }),
    ]);

    // ========== ENCABEZADO ==========
    doc.rect(0, 0, pageWidth, 110).fill(verdePrincipal);

    const logoPath = join(process.cwd(), 'uploads', 'icons', 'Logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.circle(margin + 35, 55, 28).fill('#ffffff');
        doc.image(logoPath, margin + 10, 30, { width: 50, height: 50 });
      } catch (error) {
        doc.circle(margin + 35, 55, 28).fill('#ffffff');
        doc.fontSize(22).font('Helvetica-Bold').fillColor(verdePrincipal)
          .text('GY', margin + 18, 42);
      }
    } else {
      doc.circle(margin + 35, 55, 28).fill('#ffffff');
      doc.fontSize(22).font('Helvetica-Bold').fillColor(verdePrincipal)
        .text('GY', margin + 18, 42);
    }

    doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff')
      .text('GRAMAS Y SUMINISTROS', margin + 85, 30, { width: contentWidth - 85 });

    doc.fontSize(9).font('Helvetica').fillColor('#c8e6c9')
      .text('Soluciones en césped sintético y suministros de alta calidad', margin + 85, 55, { width: contentWidth - 85 });

    doc.fontSize(8).fillColor('#c8e6c9')
      .text('NIT: 123456789-0  |  Tel: 310 000 0000  |  contacto@gramasysuministros.com', margin + 85, 72, { width: contentWidth - 85 });

    doc.fontSize(8).fillColor('#c8e6c9')
      .text('Soacha, Cundinamarca, Colombia', margin + 85, 88, { width: contentWidth - 85 });

    // ========== TÍTULO ==========
    doc.fontSize(18).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('REPORTE GENERAL DEL SISTEMA', margin, 140, { align: 'center', width: contentWidth });

    doc.fontSize(10).font('Helvetica').fillColor(grisTexto)
      .text(`Generado el ${new Date().toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })} a las ${new Date().toLocaleTimeString('es-CO')}`,
      margin, 165, { align: 'center', width: contentWidth });

    doc.strokeColor(verdePrincipal).lineWidth(2)
      .moveTo(pageWidth / 2 - 80, 185)
      .lineTo(pageWidth / 2 + 80, 185)
      .stroke();

    // ========== RESUMEN GENERAL ==========
    let currentY = 205;

    doc.fontSize(14).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('📊 RESUMEN GENERAL', margin, currentY);

    currentY += 25;

    // Tarjetas de resumen (2 columnas x 3 filas)
    const totalVentas = cotizaciones
      .filter((c) => c.estado === 'pagado' || c.estado === 'entregado')
      .reduce((sum, c) => sum + Number(c.total), 0);

    const resumenItems = [
      { label: 'Usuarios', value: usuarios.length, color: '#2e7d32' },
      { label: 'Productos', value: productos.length, color: '#1976d2' },
      { label: 'Stock Total', value: stockData.reduce((sum, s) => sum + s.cantidad_actual, 0), color: '#f57c00' },
      { label: 'Cotizaciones', value: cotizaciones.length, color: '#d32f2f' },
      { label: 'Movimientos', value: movimientos.length, color: '#9c27b0' },
      { label: 'Ventas Totales', value: `$${new Intl.NumberFormat('es-CO').format(totalVentas)}`, color: '#00897b' },
    ];

    const cardWidth = (contentWidth - 15) / 2;
    const cardHeight = 55;

    resumenItems.forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardX = margin + col * (cardWidth + 15);
      const cardY = currentY + row * (cardHeight + 10);

      // Fondo de tarjeta
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 8).fill(grisClaro);

      // Barra de color izquierda
      doc.rect(cardX, cardY, 4, cardHeight).fill(item.color);

      // Etiqueta
      doc.fontSize(9).font('Helvetica-Bold').fillColor(grisTexto)
        .text(item.label.toUpperCase(), cardX + 15, cardY + 10, { width: cardWidth - 20 });

      // Valor
      doc.fontSize(16).font('Helvetica-Bold').fillColor(item.color)
        .text(item.value.toString(), cardX + 15, cardY + 25, { width: cardWidth - 20 });
    });

    currentY += 3 * (cardHeight + 10) + 20;

    // ========== SECCIÓN DE USUARIOS ==========
    doc.fontSize(14).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('👥 USUARIOS', margin, currentY);

    currentY += 22;

    // Resumen de usuarios
    const usuariosActivos = usuarios.filter((u) => u.estado === 'activo').length;
    const usuariosInactivos = usuarios.filter((u) => u.estado === 'inactivo').length;
    const usuariosSuspendidos = usuarios.filter((u) => u.estado === 'suspendido').length;

    doc.fontSize(10).font('Helvetica').fillColor(grisOscuro)
      .text(`Total: ${usuarios.length}  |  Activos: ${usuariosActivos}  |  Inactivos: ${usuariosInactivos}  |  Suspendidos: ${usuariosSuspendidos}`,
        margin, currentY);

    currentY += 20;

    // Tabla de usuarios
    const userHeaders = ['ID', 'NOMBRE', 'EMAIL', 'ROL', 'ESTADO'];
    const userColWidths = [40, 130, 180, 100, 65];

    // Cabecera
    doc.rect(margin, currentY, contentWidth, 22).fill(verdePrincipal);
    let xPos = margin;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    userHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, currentY + 7, { width: userColWidths[i] - 10 });
      xPos += userColWidths[i];
    });

    currentY += 22;

    // Filas
    usuarios.slice(0, 8).forEach((u, index) => {
      if (index % 2 === 0) {
        doc.rect(margin, currentY, contentWidth, 20).fill('#f9f9f9');
      }

      doc.fillColor(grisOscuro);
      xPos = margin;

      const rowData = [
        u.id_usuario.toString(),
        `${u.nombre} ${u.apellido || ''}`.trim(),
        u.email.length > 25 ? u.email.substring(0, 25) + '...' : u.email,
        u.rol?.tipo || 'Sin rol',
        u.estado,
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(8).font('Helvetica').text(data, xPos + 5, currentY + 6, {
          width: userColWidths[i] - 10,
        });
        xPos += userColWidths[i];
      });

      currentY += 20;
    });

    if (usuarios.length > 8) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(grisTexto)
        .text(`... y ${usuarios.length - 8} usuarios más`, margin, currentY + 5);
      currentY += 15;
    }

    currentY += 20;

    // ========== SECCIÓN DE PRODUCTOS ==========
    doc.fontSize(14).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('📦 PRODUCTOS', margin, currentY);

    currentY += 22;

    const productosActivos = productos.filter((p) => p.estado === 1).length;
    const productosInactivos = productos.filter((p) => p.estado === 0).length;

    doc.fontSize(10).font('Helvetica').fillColor(grisOscuro)
      .text(`Total: ${productos.length}  |  Activos: ${productosActivos}  |  Inactivos: ${productosInactivos}`,
        margin, currentY);

    currentY += 20;

    const prodHeaders = ['ID', 'NOMBRE', 'CATEGORÍA', 'PRECIO', 'STOCK'];
    const prodColWidths = [40, 180, 130, 90, 75];

    doc.rect(margin, currentY, contentWidth, 22).fill(verdePrincipal);
    xPos = margin;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    prodHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, currentY + 7, { width: prodColWidths[i] - 10 });
      xPos += prodColWidths[i];
    });

    currentY += 22;

    productos.slice(0, 8).forEach((p, index) => {
      if (index % 2 === 0) {
        doc.rect(margin, currentY, contentWidth, 20).fill('#f9f9f9');
      }

      const stockItem = stockData.find((s) => s.id_producto === p.id_producto);
      doc.fillColor(grisOscuro);
      xPos = margin;

      const rowData = [
        p.id_producto.toString(),
        p.nombre.length > 28 ? p.nombre.substring(0, 28) + '...' : p.nombre,
        p.categoria?.nombre || 'Sin categoría',
        `$${new Intl.NumberFormat('es-CO').format(Number(p.precio))}`,
        (stockItem?.cantidad_actual || 0).toString(),
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(8).font('Helvetica').text(data, xPos + 5, currentY + 6, {
          width: prodColWidths[i] - 10,
        });
        xPos += prodColWidths[i];
      });

      currentY += 20;
    });

    if (productos.length > 8) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(grisTexto)
        .text(`... y ${productos.length - 8} productos más`, margin, currentY + 5);
      currentY += 15;
    }

    // ========== NUEVA PÁGINA PARA COTIZACIONES ==========
    doc.addPage();

    // Encabezado de nueva página
    doc.rect(0, 0, pageWidth, 50).fill(verdePrincipal);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
      .text('GRAMAS Y SUMINISTROS - REPORTE (continuación)', margin, 18, { width: contentWidth });

    currentY = 80;

    // ========== SECCIÓN DE COTIZACIONES ==========
    doc.fontSize(14).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('💰 COTIZACIONES', margin, currentY);

    currentY += 22;

    const pendientes = cotizaciones.filter((c) => c.estado === 'pendiente').length;
    const pagadas = cotizaciones.filter((c) => c.estado === 'pagado').length;
    const entregadas = cotizaciones.filter((c) => c.estado === 'entregado').length;
    const canceladas = cotizaciones.filter((c) => c.estado === 'cancelado').length;

    doc.fontSize(10).font('Helvetica').fillColor(grisOscuro)
      .text(`Total: ${cotizaciones.length}  |  Pendientes: ${pendientes}  |  Pagadas: ${pagadas}  |  Entregadas: ${entregadas}  |  Canceladas: ${canceladas}`,
        margin, currentY);

    currentY += 15;

    doc.fontSize(11).font('Helvetica-Bold').fillColor(verdePrincipal)
      .text(`💰 Ventas Totales: $${new Intl.NumberFormat('es-CO').format(totalVentas)}`, margin, currentY);

    currentY += 25;

    const cotHeaders = ['ID', 'CLIENTE', 'TOTAL', 'ESTADO', 'FECHA'];
    const cotColWidths = [40, 180, 90, 90, 115];

    doc.rect(margin, currentY, contentWidth, 22).fill(verdePrincipal);
    xPos = margin;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
    cotHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, currentY + 7, { width: cotColWidths[i] - 10 });
      xPos += cotColWidths[i];
    });

    currentY += 22;

    cotizaciones.slice(0, 15).forEach((c, index) => {
      if (index % 2 === 0) {
        doc.rect(margin, currentY, contentWidth, 20).fill('#f9f9f9');
      }

      doc.fillColor(grisOscuro);
      xPos = margin;

      const cliente = (c.usuario?.nombre || c.usuario?.email || 'Anónimo');
      const rowData = [
        c.idCotizacion.toString(),
        cliente.length > 28 ? cliente.substring(0, 28) + '...' : cliente,
        `$${new Intl.NumberFormat('es-CO').format(Number(c.total))}`,
        c.estado,
        c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-CO') : '-',
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(8).font('Helvetica').text(data, xPos + 5, currentY + 6, {
          width: cotColWidths[i] - 10,
        });
        xPos += cotColWidths[i];
      });

      currentY += 20;
    });

    if (cotizaciones.length > 15) {
      doc.fontSize(8).font('Helvetica-Oblique').fillColor(grisTexto)
        .text(`... y ${cotizaciones.length - 15} cotizaciones más`, margin, currentY + 5);
      currentY += 15;
    }

    currentY += 20;

    // ========== SECCIÓN DE STOCK CRÍTICO ==========
    doc.fontSize(14).font('Helvetica-Bold').fillColor(verdeOscuro)
      .text('⚠️ ALERTAS DE STOCK', margin, currentY);

    currentY += 22;

    const stockCritico = stockData.filter(
      (s) => s.cantidad_actual === 0 || s.cantidad_actual <= s.nivel_minimo,
    );

    if (stockCritico.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#2e7d32')
        .text('✅ No hay productos con stock crítico.', margin, currentY);
    } else {
      const alertHeaders = ['PRODUCTO', 'STOCK ACTUAL', 'MÍNIMO', 'ESTADO'];
      const alertColWidths = [220, 100, 100, 95];

      doc.rect(margin, currentY, contentWidth, 22).fill('#d32f2f');
      xPos = margin;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
      alertHeaders.forEach((header, i) => {
        doc.text(header, xPos + 5, currentY + 7, { width: alertColWidths[i] - 10 });
        xPos += alertColWidths[i];
      });

      currentY += 22;

      stockCritico.slice(0, 10).forEach((s, index) => {
        const estado = s.cantidad_actual === 0 ? 'Sin stock' : 'Stock bajo';

        if (index % 2 === 0) {
          doc.rect(margin, currentY, contentWidth, 20).fill('#fff3f3');
        }

        doc.fillColor(grisOscuro);
        xPos = margin;

        const rowData = [
          s.producto?.nombre || 'Desconocido',
          s.cantidad_actual.toString(),
          s.nivel_minimo.toString(),
          estado,
        ];

        rowData.forEach((data, i) => {
          doc.fontSize(8).font('Helvetica').text(data, xPos + 5, currentY + 6, {
            width: alertColWidths[i] - 10,
          });
          xPos += alertColWidths[i];
        });

        currentY += 20;
      });
    }

    // ========== PIE DE PÁGINA ==========
    const footerY = pageHeight - 60;

    doc.strokeColor(verdeClaro).lineWidth(1)
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .stroke();

    doc.fontSize(10).font('Helvetica-Bold').fillColor(verdePrincipal)
      .text('¡Gracias por usar nuestro sistema!', margin, footerY + 10, { align: 'center', width: contentWidth });

    doc.fontSize(8).font('Helvetica').fillColor(grisTexto)
      .text('Gramas y Suministros - Calidad que transforma espacios', margin, footerY + 25, { align: 'center', width: contentWidth });

    doc.fontSize(7).fillColor('#999999')
      .text('Reporte generado automáticamente por el sistema de gestión', margin, footerY + 38, { align: 'center', width: contentWidth });

    doc.end();

    return { mensaje: 'PDF generado exitosamente' };
  }

  // ============ HELPERS ============
  private agruparPorDia(data: any[], campoFecha: string) {
    const grupos = new Map<string, number>();

    data.forEach((item) => {
      const fecha = new Date(item[campoFecha]);
      const clave = fecha.toISOString().split('T')[0];
      grupos.set(clave, (grupos.get(clave) || 0) + 1);
    });

    return Array.from(grupos.entries())
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  private agruparPorDiaConTotal(data: any[], campoFecha: string) {
    const grupos = new Map<string, number>();

    data.forEach((item) => {
      const fecha = new Date(item[campoFecha]);
      const clave = fecha.toISOString().split('T')[0];
      const total = Number(item.total) || 0;
      grupos.set(clave, (grupos.get(clave) || 0) + total);
    });

    return Array.from(grupos.entries())
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }
}