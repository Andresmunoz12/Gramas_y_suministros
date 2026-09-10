// src/cotizaciones/cotizaciones.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { DetalleCotizacion } from './detalle-cotizacion.entity';
import { productos } from '../productos/productos.entity';
import { movimiento } from '../movimiento/movimiento.entity';
import { stock } from '../stock/stock.entity';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { usuario } from '../Usuarios/usuarios.entity';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion)
    private cotizacionRepo: Repository<Cotizacion>,
    @InjectRepository(DetalleCotizacion)
    private detalleRepo: Repository<DetalleCotizacion>,
    @InjectRepository(productos)
    private productoRepo: Repository<productos>,
    @InjectRepository(movimiento)
    private movimientoRepo: Repository<movimiento>,
    @InjectRepository(stock)
    private stockRepo: Repository<stock>,
  ) {}

  async crearCotizacion(usuarioId: number, dto: CrearCotizacionDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un producto');
    }

    const usuarioExistente = await this.cotizacionRepo.manager.findOne(usuario, {
      where: { id_usuario: usuarioId },
    });

    if (!usuarioExistente) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let subtotal = 0;
    const detalles: any[] = [];

    for (const item of dto.items) {
      const producto = await this.productoRepo.findOne({
        where: { id_producto: item.idProducto },
      });

      if (!producto) {
        throw new NotFoundException(`Producto ID ${item.idProducto} no encontrado`);
      }

      if (producto.estado === 0) {
        throw new BadRequestException(`El producto "${producto.nombre}" está inactivo`);
      }

      const stockRegistro = await this.stockRepo.findOne({
        where: { id_producto: item.idProducto },
      });

      const stockDisponible = stockRegistro ? stockRegistro.cantidad_actual : 0;

      if (item.cantidad > stockDisponible) {
        throw new BadRequestException(
          `La cantidad solicitada del producto "${producto.nombre}" supera el stock disponible (Máximo: ${stockDisponible})`,
        );
      }

      const precioUnitario = producto.precio;
      const subtotalItem = precioUnitario * item.cantidad;
      subtotal += subtotalItem;

      detalles.push({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: subtotalItem,
        nombreProducto: producto.nombre,
      });
    }

    const costoEnvio = dto.metodoVenta === 'envio' ? 8000 : 0;
    const total = subtotal + costoEnvio;

    const cotizacionData: any = {
      idUsuario: usuarioId,
      metodoVenta: dto.metodoVenta,
      metodoPago: dto.metodoPago,
      subtotal: subtotal,
      costoEnvio: costoEnvio,
      total: total,
      estado: 'pendiente',
    };

    if (dto.metodoVenta === 'envio' && dto.direccionEnvio) {
      cotizacionData.direccionEnvio = dto.direccionEnvio;
    }

    const savedCotizacion = await this.cotizacionRepo.save(cotizacionData);
    const cotizacionId = savedCotizacion.idCotizacion;

    for (const detalle of detalles) {
      const detalleEntity = this.detalleRepo.create({
        idCotizacion: cotizacionId,
        idProducto: detalle.idProducto,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        subtotal: detalle.subtotal,
      });
      await this.detalleRepo.save(detalleEntity);
    }

    return this.obtenerCotizacionCompleta(cotizacionId);
  }

  async obtenerCotizacionCompleta(idCotizacion: number, user?: any) {
    const cotizacion = await this.cotizacionRepo.findOne({
      where: { idCotizacion },
      relations: ['usuario', 'detalles', 'detalles.producto'],
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    if (user && Number(user.rol) !== 1 && Number(cotizacion.idUsuario) !== Number(user.userId)) {
      throw new ForbiddenException('No tienes permiso para acceder a esta cotización');
    }

    return cotizacion;
  }

  async obtenerCotizacionesUsuario(usuarioId: number) {
    return this.cotizacionRepo.find({
      where: { idUsuario: usuarioId },
      relations: ['detalles', 'detalles.producto'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async simularPago(idCotizacion: number) {
    const cotizacion = await this.cotizacionRepo.findOne({
      where: { idCotizacion },
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    if (cotizacion.estado === 'pagado') {
      throw new BadRequestException('Esta cotización ya fue pagada');
    }

    cotizacion.estado = 'pagado';
    cotizacion.fechaPago = new Date();

    await this.cotizacionRepo.save(cotizacion);

    return {
      mensaje: 'Pago simulado exitosamente',
      cotizacion: await this.obtenerCotizacionCompleta(idCotizacion),
    };
  }

  async generarPDF(idCotizacion: number, user: any, res: Response) {
    const cotizacion = await this.obtenerCotizacionCompleta(idCotizacion);

    if (Number(user.rol) !== 1 && Number(cotizacion.idUsuario) !== Number(user.userId)) {
      throw new ForbiddenException('No tienes permiso para descargar esta cotización');
    }

    console.log(`[AUDIT] Descarga de PDF de cotización #${idCotizacion} por usuario #${user.userId} (Rol: ${user.rol})`);

    const doc = new PDFDocument({ margin: 0, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cotizacion_${cotizacion.idCotizacion}.pdf`,
    );

    doc.pipe(res);

    // ========== COLORES CORPORATIVOS ==========
    const verdePrincipal = '#2e7d32';
    const verdeOscuro = '#1b5e20';
    const verdeClaro = '#e8f5e9';
    const grisOscuro = '#333333';
    const grisClaro = '#f5f5f5';
    const grisTexto = '#666666';

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // ========== ENCABEZADO CON BARRA VERDE ==========
    doc.rect(0, 0, pageWidth, 110).fill(verdePrincipal);

    // Logo (imagen desde el sistema de archivos)
    const logoPath = join(process.cwd(), 'uploads', 'icons', 'Logo.png');

    if (fs.existsSync(logoPath)) {
      try {
        // Recuadro blanco circular detrás del logo
        doc.circle(margin + 35, 55, 28).fill('#ffffff');
        doc.image(logoPath, margin + 10, 30, { width: 50, height: 50 });
      } catch (error) {
        console.error('Error al cargar el logo:', error);
        // Fallback: círculo con iniciales
        doc.circle(margin + 35, 55, 28).fill('#ffffff');
        doc
          .fontSize(22)
          .font('Helvetica-Bold')
          .fillColor(verdePrincipal)
          .text('GY', margin + 18, 42);
      }
    } else {
      // Fallback si no existe el logo
      doc.circle(margin + 35, 55, 28).fill('#ffffff');
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .fillColor(verdePrincipal)
        .text('GY', margin + 18, 42);
    }

    // Nombre de la empresa
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('GRAMAS Y SUMINISTROS', margin + 85, 30, { width: contentWidth - 85 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#c8e6c9')
      .text('Soluciones en césped sintético y suministros de alta calidad', margin + 85, 55, { width: contentWidth - 85 });

    doc
      .fontSize(8)
      .fillColor('#c8e6c9')
      .text('NIT: 123456789-0  |  Tel: 310 000 0000  |  contacto@gramasysuministros.com', margin + 85, 72, { width: contentWidth - 85 });

    doc
      .fontSize(8)
      .fillColor('#c8e6c9')
      .text('Soacha, Cundinamarca, Colombia', margin + 85, 88, { width: contentWidth - 85 });

    // ========== TÍTULO DEL DOCUMENTO ==========
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(verdeOscuro)
      .text(`COTIZACIÓN #${cotizacion.idCotizacion}`, margin, 140, { align: 'center', width: contentWidth });

    // Línea decorativa
    doc
      .strokeColor(verdePrincipal)
      .lineWidth(2)
      .moveTo(pageWidth / 2 - 50, 165)
      .lineTo(pageWidth / 2 + 50, 165)
      .stroke();

    // ========== INFORMACIÓN GENERAL (FECHA Y ESTADO) ==========
    const infoY = 185;

    // Recuadro de fecha
    doc
      .roundedRect(margin, infoY, contentWidth / 2 - 10, 50, 5)
      .fill(grisClaro);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(grisTexto)
      .text('FECHA DE EMISIÓN', margin + 15, infoY + 12);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(grisOscuro)
      .text(
        new Date(cotizacion.fechaCreacion).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        margin + 15,
        infoY + 27,
      );

    // Recuadro de estado
    const estadoColor = cotizacion.estado === 'pagado' ? '#2e7d32' :
                        cotizacion.estado === 'pendiente' ? '#f57c00' :
                        cotizacion.estado === 'entregado' ? '#1976d2' : '#d32f2f';

    doc
      .roundedRect(margin + contentWidth / 2 + 10, infoY, contentWidth / 2 - 10, 50, 5)
      .fill(estadoColor);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('ESTADO', margin + contentWidth / 2 + 25, infoY + 12);

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text(cotizacion.estado.toUpperCase(), margin + contentWidth / 2 + 25, infoY + 27);

    // ========== DATOS DEL CLIENTE ==========
    const clienteY = infoY + 80;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(verdeOscuro)
      .text('INFORMACIÓN DEL CLIENTE', margin, clienteY);

    doc
      .strokeColor(verdeClaro)
      .lineWidth(1)
      .moveTo(margin, clienteY + 18)
      .lineTo(margin + contentWidth, clienteY + 18)
      .stroke();

    const clienteDataY = clienteY + 28;

    // Columna izquierda
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(grisTexto)
      .text('NOMBRE:', margin, clienteDataY);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(grisOscuro)
      .text(`${cotizacion.usuario.nombre} ${cotizacion.usuario.apellido || ''}`, margin, clienteDataY + 14);

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(grisTexto)
      .text('CORREO ELECTRÓNICO:', margin, clienteDataY + 40);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(grisOscuro)
      .text(cotizacion.usuario.email, margin, clienteDataY + 54);

    // Columna derecha
    const colRightX = margin + contentWidth / 2 + 10;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(grisTexto)
      .text('MÉTODO DE VENTA:', colRightX, clienteDataY);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(grisOscuro)
      .text(
        cotizacion.metodoVenta === 'fisico' ? 'Punto físico' : 'Entrega al cliente',
        colRightX,
        clienteDataY + 14,
      );

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(grisTexto)
      .text('MÉTODO DE PAGO:', colRightX, clienteDataY + 40);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(grisOscuro)
      .text(
        cotizacion.metodoPago === 'efectivo' ? 'Efectivo' :
        cotizacion.metodoPago === 'tarjeta_debito' ? 'Tarjeta débito' : 'Tarjeta crédito',
        colRightX,
        clienteDataY + 54,
      );

    // ========== TABLA DE PRODUCTOS ==========
    const tableY = clienteDataY + 100;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(verdeOscuro)
      .text('DETALLE DE PRODUCTOS', margin, tableY);

    const tableHeaderY = tableY + 22;
    const rowHeight = 25;
    const colWidths = [50, 250, 100, 100];

    doc.rect(margin, tableHeaderY, contentWidth, rowHeight).fill(verdePrincipal);

    const headers = ['CANT.', 'PRODUCTO', 'PRECIO', 'SUBTOTAL'];
    let xPos = margin;

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
    headers.forEach((header, i) => {
      doc.text(header, xPos + 8, tableHeaderY + 8, {
        width: colWidths[i] - 16,
        align: i === 0 ? 'center' : i === 1 ? 'left' : 'right',
      });
      xPos += colWidths[i];
    });

    let rowY = tableHeaderY + rowHeight;
    doc.font('Helvetica').fillColor(grisOscuro);

    cotizacion.detalles.forEach((detalle, index) => {
      const producto = detalle.producto;
      const nombre = producto?.nombre || 'Producto eliminado';
      const precioFormateado = new Intl.NumberFormat('es-CO').format(detalle.precioUnitario);
      const subtotalFormateado = new Intl.NumberFormat('es-CO').format(detalle.subtotal);

      if (index % 2 === 0) {
        doc.rect(margin, rowY, contentWidth, rowHeight).fill('#f9f9f9');
      }

      doc.fillColor(grisOscuro);

      xPos = margin;
      const rowData = [
        detalle.cantidad.toString(),
        nombre.length > 40 ? nombre.substring(0, 40) + '...' : nombre,
        `$${precioFormateado}`,
        `$${subtotalFormateado}`,
      ];

      rowData.forEach((data, i) => {
        doc.fontSize(10).font('Helvetica').text(data, xPos + 8, rowY + 8, {
          width: colWidths[i] - 16,
          align: i === 0 ? 'center' : i === 1 ? 'left' : 'right',
        });
        xPos += colWidths[i];
      });

      rowY += rowHeight;
    });

    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(margin, rowY)
      .lineTo(margin + contentWidth, rowY)
      .stroke();

    // ========== TOTALES ==========
    const totalesY = rowY + 20;
    const totalesX = margin + contentWidth - 200;

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(grisTexto)
      .text('Subtotal:', totalesX, totalesY, { width: 100, align: 'right' });

    doc
      .font('Helvetica-Bold')
      .fillColor(grisOscuro)
      .text(`$${new Intl.NumberFormat('es-CO').format(cotizacion.subtotal)}`, totalesX + 100, totalesY, { width: 100, align: 'right' });

    let currentY = totalesY + 20;
    if (cotizacion.costoEnvio > 0) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor(grisTexto)
        .text('Costo de envío:', totalesX, currentY, { width: 100, align: 'right' });

      doc
        .font('Helvetica-Bold')
        .fillColor(grisOscuro)
        .text(`$${new Intl.NumberFormat('es-CO').format(cotizacion.costoEnvio)}`, totalesX + 100, currentY, { width: 100, align: 'right' });

      currentY += 20;
    }

    doc
      .strokeColor(verdeClaro)
      .lineWidth(1)
      .moveTo(totalesX, currentY)
      .lineTo(totalesX + 200, currentY)
      .stroke();

    currentY += 10;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(verdeOscuro)
      .text('TOTAL:', totalesX, currentY, { width: 100, align: 'right' });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(verdePrincipal)
      .text(`$${new Intl.NumberFormat('es-CO').format(cotizacion.total)}`, totalesX + 100, currentY - 2, { width: 100, align: 'right' });

    // ========== INFORMACIÓN DE ENVÍO ==========
    let envioY = currentY + 50;

    if (cotizacion.metodoVenta === 'envio') {
      doc
        .roundedRect(margin, envioY, contentWidth, 70, 5)
        .fill('#fff3e0');

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#e65100')
        .text('INFORMACIÓN DE ENVÍO', margin + 15, envioY + 12);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#bf360c')
        .text(`Dirección: ${cotizacion.direccionEnvio || 'No especificada'}`, margin + 15, envioY + 28);

      doc
        .fontSize(9)
        .fillColor('#bf360c')
        .text('El producto puede tardar entre 3 y 7 días hábiles en llegar.', margin + 15, envioY + 44);

      doc
        .fontSize(9)
        .fillColor('#bf360c')
        .text('Te enviaremos el estado del pedido al correo electrónico registrado.', margin + 15, envioY + 56);
    } else {
      doc
        .roundedRect(margin, envioY, contentWidth, 50, 5)
        .fill(verdeClaro);

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(verdeOscuro)
        .text('RECOGER EN PUNTO FÍSICO', margin + 15, envioY + 12);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(verdeOscuro)
        .text('Presenta este documento en nuestro punto de venta para reclamar tu pedido.', margin + 15, envioY + 30);
    }

    // ========== PIE DE PÁGINA ==========
    const footerY = pageHeight - 80;

    doc
      .strokeColor(verdeClaro)
      .lineWidth(1)
      .moveTo(margin, footerY)
      .lineTo(pageWidth - margin, footerY)
      .stroke();

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(verdePrincipal)
      .text('¡Gracias por preferirnos!', margin, footerY + 15, { align: 'center', width: contentWidth });

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(grisTexto)
      .text('Gramas y Suministros - Calidad que transforma espacios', margin, footerY + 32, { align: 'center', width: contentWidth });

    doc
      .fontSize(7)
      .fillColor('#999999')
      .text('Este documento es una cotización válida por 15 días a partir de la fecha de emisión.', margin, footerY + 48, { align: 'center', width: contentWidth });

    doc.end();

    return {
      mensaje: 'PDF generado exitosamente',
    };
  }

  // ========== MÉTODOS PARA ADMINISTRADOR ==========

  async obtenerTodasCotizaciones(filtros: {
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    search?: string;
  }) {
    const query = this.cotizacionRepo
      .createQueryBuilder('cotizacion')
      .leftJoinAndSelect('cotizacion.usuario', 'usuario')
      .leftJoinAndSelect('cotizacion.detalles', 'detalles')
      .leftJoinAndSelect('detalles.producto', 'producto');

    if (filtros.estado) {
      query.andWhere('cotizacion.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.fechaInicio) {
      query.andWhere('cotizacion.fechaCreacion >= :fechaInicio', {
        fechaInicio: new Date(filtros.fechaInicio)
      });
    }
    if (filtros.fechaFin) {
      query.andWhere('cotizacion.fechaCreacion <= :fechaFin', {
        fechaFin: new Date(filtros.fechaFin)
      });
    }

    if (filtros.search) {
      query.andWhere(
        '(usuario.nombre LIKE :search OR usuario.email LIKE :search)',
        { search: `%${filtros.search}%` },
      );
    }

    query.orderBy('cotizacion.fechaCreacion', 'DESC');

    return query.getMany();
  }

  async actualizarEstado(idCotizacion: number, estado: string) {
    const cotizacion = await this.cotizacionRepo.findOne({
      where: { idCotizacion },
      relations: ['detalles', 'detalles.producto'],
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const estadosValidos = ['pendiente', 'pagado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`);
    }

    if (estado === 'entregado' && cotizacion.estado !== 'entregado') {
      await this.restarStockCotizacion(cotizacion);
    }

    if (cotizacion.estado === 'entregado' && estado !== 'entregado') {
      await this.devolverStockCotizacion(cotizacion);
    }

    cotizacion.estado = estado;
    await this.cotizacionRepo.save(cotizacion);

    return {
      mensaje: `Estado actualizado a "${estado}"`,
      cotizacion: await this.obtenerCotizacionCompleta(idCotizacion),
    };
  }

  private async restarStockCotizacion(cotizacion: Cotizacion) {
    for (const detalle of cotizacion.detalles) {
      const stockRegistro = await this.stockRepo.findOne({
        where: { id_producto: detalle.idProducto },
      });

      if (!stockRegistro) {
        throw new NotFoundException(`Stock para producto ID ${detalle.idProducto} no encontrado`);
      }

      if (stockRegistro.cantidad_actual < detalle.cantidad) {
        const producto = await this.productoRepo.findOne({
          where: { id_producto: detalle.idProducto },
        });
        throw new BadRequestException(
          `Stock insuficiente para "${producto?.nombre || 'Producto'}". Disponible: ${stockRegistro.cantidad_actual}, Requerido: ${detalle.cantidad}`
        );
      }

      await this.stockRepo
        .createQueryBuilder()
        .update(stock)
        .set({
          cantidad_actual: () => `cantidad_actual - ${detalle.cantidad}`,
          ultima_actualizacion: () => 'CURRENT_TIMESTAMP',
        })
        .where('id_producto = :id', { id: detalle.idProducto })
        .execute();

      await this.registrarMovimiento(
        detalle.idProducto,
        detalle.cantidad,
        'salida',
        `Venta por cotización #${cotizacion.idCotizacion}`,
        cotizacion.idUsuario,
      );
    }
  }

  private async devolverStockCotizacion(cotizacion: Cotizacion) {
    for (const detalle of cotizacion.detalles) {
      await this.stockRepo
        .createQueryBuilder()
        .update(stock)
        .set({
          cantidad_actual: () => `cantidad_actual + ${detalle.cantidad}`,
          ultima_actualizacion: () => 'CURRENT_TIMESTAMP',
        })
        .where('id_producto = :id', { id: detalle.idProducto })
        .execute();

      await this.registrarMovimiento(
        detalle.idProducto,
        detalle.cantidad,
        'entrada',
        `Devolución por cotización #${cotizacion.idCotizacion}`,
        cotizacion.idUsuario,
      );
    }
  }

  private async registrarMovimiento(
    idProducto: number,
    cantidad: number,
    tipo: 'entrada' | 'salida',
    detalle: string,
    idUsuario: number,
  ) {
    const movimiento = this.movimientoRepo.create({
      id_producto: idProducto,
      id_usuario: idUsuario,
      cantidad: cantidad,
      tipo: tipo,
      detalle: detalle,
      fecha: new Date(),
    });
    await this.movimientoRepo.save(movimiento);
  }

  async obtenerEstadisticas() {
    const total = await this.cotizacionRepo.count();
    const pendiente = await this.cotizacionRepo.count({ where: { estado: 'pendiente' } });
    const pagado = await this.cotizacionRepo.count({ where: { estado: 'pagado' } });
    const entregado = await this.cotizacionRepo.count({ where: { estado: 'entregado' } });
    const cancelado = await this.cotizacionRepo.count({ where: { estado: 'cancelado' } });

    const ventasTotalesResult = await this.cotizacionRepo
      .createQueryBuilder('cotizacion')
      .select('SUM(cotizacion.total)', 'total')
      .where('cotizacion.estado IN (:...estados)', { estados: ['pagado', 'entregado'] })
      .getRawOne();

    const ventasTotales = Number(ventasTotalesResult?.total || 0);

    const unMesAtras = new Date();
    unMesAtras.setMonth(unMesAtras.getMonth() - 1);
    const ultimoMes = await this.cotizacionRepo.count({
      where: {
        fechaCreacion: MoreThanOrEqual(unMesAtras),
      },
    });

    const unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(unaSemanaAtras.getDate() - 7);
    const ultimaSemana = await this.cotizacionRepo.count({
      where: {
        fechaCreacion: MoreThanOrEqual(unaSemanaAtras),
      },
    });

    const usuariosRegistrados = await this.cotizacionRepo.manager.count(usuario);
    const productosRegistrados = await this.productoRepo.count();

    const stockTotalResult = await this.stockRepo
      .createQueryBuilder('stock')
      .select('SUM(stock.cantidad_actual)', 'total')
      .getRawOne();
    const stockTotal = Number(stockTotalResult?.total || 0);

    return {
      total,
      pendiente,
      pagado,
      entregado,
      cancelado,
      ventasTotales,
      ultimoMes,
      ultimaSemana,
      usuariosRegistrados,
      productosRegistrados,
      stockTotal,
    };
  }
}