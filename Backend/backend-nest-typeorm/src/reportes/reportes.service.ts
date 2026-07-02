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
      .where('c.estado IN (:...estados)', { estados: ['pagado', 'entregado'] }) // ✅ Incluir entregado
      .andWhere('MONTH(c.fechaCreacion) = MONTH(CURRENT_DATE())')
      .andWhere('YEAR(c.fechaCreacion) = YEAR(CURRENT_DATE())')
      .getRawOne();

    // ✅ Usuarios en línea (último login hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const usuariosEnLinea = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .where('u.ultimoLogin >= :hoy', { hoy })
      .andWhere('u.estado = :estado', { estado: 'activo' })
      .orderBy('u.ultimoLogin', 'DESC')
      .getMany();

    // ✅ Usuarios nuevos por día (últimos 7 días)
    const usuariosNuevos = await this.getUsuariosNuevosPorDia(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    // ✅ Productos nuevos por día (últimos 7 días)
    const productosNuevos = await this.getProductosNuevosPorDia(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    // ✅ Ventas diarias (últimos 30 días)
    const ventasDiarias = await this.getVentasDiarias(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    // ✅ Datos combinados para gráfico comparativo
    const fechas = new Set();
    usuariosNuevos.data.forEach(item => fechas.add(item.fecha));
    productosNuevos.data.forEach(item => fechas.add(item.fecha));
    
    const comparativoNuevos = Array.from(fechas).sort().map(fecha => ({
      fecha,
      usuarios: usuariosNuevos.data.find(u => u.fecha === fecha)?.cantidad || 0,
      productos: productosNuevos.data.find(p => p.fecha === fecha)?.cantidad || 0,
    }));

    // ✅ Últimos usuarios registrados
    const ultimosUsuarios = await this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .orderBy('u.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // ✅ Últimos productos agregados
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

  // ✅ SUMAR TODAS las cotizaciones PAGADAS Y ENTREGADAS
  const totalVentas = cotizaciones
    .filter((c) => c.estado === 'pagado' || c.estado === 'entregado') // ✅ Incluir entregado
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
    totalVentas, // ✅ Ahora suma pagado + entregado
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
  async exportarExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte General');

    const [usuarios, productos, stockData, cotizaciones] = await Promise.all([
      this.userRepository.find({ relations: ['rol'] }),
      this.productRepository.find({ relations: ['categoria'] }),
      this.stockRepository.find({ relations: ['producto'] }),
      this.cotizacionRepository.find({ relations: ['usuario'] }),
    ]);

    worksheet.columns = [
      { header: 'Módulo', key: 'modulo', width: 20 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Activos', key: 'activos', width: 15 },
      { header: 'Inactivos', key: 'inactivos', width: 15 },
    ];

    worksheet.addRow({
      modulo: 'Usuarios',
      total: usuarios.length,
      activos: usuarios.filter((u) => u.estado === 'activo').length,
      inactivos: usuarios.filter((u) => u.estado !== 'activo').length,
    });

    worksheet.addRow({
      modulo: 'Productos',
      total: productos.length,
      activos: productos.filter((p) => p.estado === 1).length,
      inactivos: productos.filter((p) => p.estado === 0).length,
    });

    worksheet.addRow({
      modulo: 'Stock',
      total: stockData.length,
      activos: stockData.filter((s) => s.cantidad_actual > 0).length,
      inactivos: stockData.filter((s) => s.cantidad_actual === 0).length,
    });

    worksheet.addRow({
      modulo: 'Cotizaciones',
      total: cotizaciones.length,
      activos: cotizaciones.filter((c) => c.estado === 'pagado').length,
      inactivos: cotizaciones.filter((c) => c.estado !== 'pagado').length,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async exportarPDF(res: Response) {
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=reporte_${new Date().toISOString().split('T')[0]}.pdf`,
    );

    doc.pipe(res);

    const [usuarios, productos, stockData, cotizaciones] = await Promise.all([
      this.userRepository.count(),
      this.productRepository.count(),
      this.stockRepository.find(),
      this.cotizacionRepository.find(),
    ]);

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('Reporte General', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#333')
      .text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' })
      .moveDown(2);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('Resumen General')
      .moveDown(0.5);

    const data = [
    { label: 'Usuarios', value: usuarios },
    { label: 'Productos', value: productos },
    { label: 'Stock Total', value: stockData.reduce((sum, s) => sum + s.cantidad_actual, 0) },
    { label: 'Cotizaciones', value: cotizaciones.length },
    { label: 'Cotizaciones Pendientes', value: cotizaciones.filter((c) => c.estado === 'pendiente').length },
    // ✅ CORREGIDO: Sumar pagado + entregado
    { 
      label: 'Ventas Totales', 
      value: `$${new Intl.NumberFormat('es-CO').format(
        cotizaciones
          .filter((c) => c.estado === 'pagado' || c.estado === 'entregado') // ✅ Incluir entregado
          .reduce((sum, c) => sum + Number(c.total), 0)
      )}` 
    },
  ];

    data.forEach((item) => {
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#333')
        .text(`${item.label}: ${item.value}`, { indent: 20 });
    });

    doc
      .moveDown(2)
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666')
      .text('Reporte generado automáticamente por Gramas y Suministros', { align: 'center' });

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