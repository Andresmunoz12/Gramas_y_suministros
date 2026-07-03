// src/cotizaciones/cotizaciones.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async obtenerCotizacionCompleta(idCotizacion: number) {
    const cotizacion = await this.cotizacionRepo.findOne({
      where: { idCotizacion },
      relations: ['usuario', 'detalles', 'detalles.producto'],
    });

    if (!cotizacion) {
      throw new NotFoundException('Cotización no encontrada');
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

  async generarPDF(idCotizacion: number, res: Response) {
    const cotizacion = await this.obtenerCotizacionCompleta(idCotizacion);

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=cotizacion_${cotizacion.idCotizacion}.pdf`,
    );

    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('GRAMAS Y SUMINISTROS', { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .fillColor('#333')
      .text('NIT: 123456789-0', { align: 'center' })
      .text('Tel: 310 000 0000', { align: 'center' })
      .moveDown();

    doc
      .strokeColor('#2e7d32')
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(0.5);

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text(`RECIBO DE COTIZACIÓN #${cotizacion.idCotizacion}`)
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#333')
      .text(`Fecha: ${cotizacion.fechaCreacion.toLocaleDateString('es-CO')}  Hora: ${cotizacion.fechaCreacion.toLocaleTimeString('es-CO')}`)
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('DATOS DEL CLIENTE')
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333');

    const usuarioData = cotizacion.usuario;
    doc
      .text(`Nombre: ${usuarioData.nombre} ${usuarioData.apellido || ''}`)
      .text(`Email: ${usuarioData.email}`)
      .moveDown();

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('PRODUCTOS')
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333');

    const tableTop = doc.y;
    const tableHeaders = ['Cant.', 'Producto', 'Precio', 'Subtotal'];
    const columnWidths = [60, 220, 100, 100];
    let xPos = 50;

    doc.font('Helvetica-Bold').fillColor('#fff');
    doc.rect(50, tableTop, 500, 20).fill('#2e7d32');
    doc.fillColor('#fff');

    xPos = 50;
    tableHeaders.forEach((header, i) => {
      doc.text(header, xPos + 5, tableTop + 5, {
        width: columnWidths[i],
        align: 'left',
      });
      xPos += columnWidths[i];
    });

    let yPos = tableTop + 25;
    doc.font('Helvetica').fillColor('#333');

    cotizacion.detalles.forEach((detalle) => {
      const producto = detalle.producto;
      const nombre = producto?.nombre || 'Producto eliminado';
      const precioFormateado = new Intl.NumberFormat('es-CO').format(detalle.precioUnitario);
      const subtotalFormateado = new Intl.NumberFormat('es-CO').format(detalle.subtotal);

      xPos = 50;
      const rowData = [
        detalle.cantidad.toString(),
        nombre.length > 20 ? nombre.substring(0, 20) + '...' : nombre,
        `$${precioFormateado}`,
        `$${subtotalFormateado}`,
      ];

      rowData.forEach((data, i) => {
        doc.text(data, xPos + 5, yPos, {
          width: columnWidths[i],
          align: 'left',
        });
        xPos += columnWidths[i];
      });

      yPos += 20;
    });

    yPos += 10;
    const totalLabel = 'Subtotal:';
    const totalValue = `$${new Intl.NumberFormat('es-CO').format(cotizacion.subtotal)}`;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#333')
      .text(totalLabel, 350, yPos, { width: 100, align: 'right' })
      .text(totalValue, 460, yPos, { width: 100, align: 'right' });

    yPos += 20;
    if (cotizacion.costoEnvio > 0) {
      doc
        .text('Envío:', 350, yPos, { width: 100, align: 'right' })
        .text(`$${new Intl.NumberFormat('es-CO').format(cotizacion.costoEnvio)}`, 460, yPos, { width: 100, align: 'right' });
      yPos += 20;
    }

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#2e7d32')
      .text('TOTAL:', 350, yPos, { width: 100, align: 'right' })
      .text(`$${new Intl.NumberFormat('es-CO').format(cotizacion.total)}`, 460, yPos, { width: 100, align: 'right' });

    yPos += 30;

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333')
      .text(`Método de venta: ${cotizacion.metodoVenta === 'fisico' ? 'Punto físico' : 'Entrega al cliente'}`)
      .text(`Método de pago: ${cotizacion.metodoPago === 'efectivo' ? 'Efectivo' : cotizacion.metodoPago === 'tarjeta_debito' ? 'Tarjeta débito' : 'Tarjeta crédito'}`);

    if (cotizacion.metodoVenta === 'envio') {
      yPos += 15;
      doc
        .fontSize(10)
        .fillColor('#f57c00')
        .text(`Dirección de envío: ${cotizacion.direccionEnvio || 'No especificada'}`)
        .moveDown()
        .fillColor('#333')
        .text('⏱️ El producto puede tardar entre 3 y 7 días en llegar.')
        .text('📧 Te enviaremos el estado del pedido al correo electrónico.');
    } else {
      yPos += 15;
      doc
        .fontSize(10)
        .fillColor('#2e7d32')
        .text('📍 Lleve este recibo al punto físico de la empresa.');
    }

    yPos = doc.y + 40;
    doc
      .strokeColor('#2e7d32')
      .lineWidth(1)
      .moveTo(50, yPos)
      .lineTo(550, yPos)
      .stroke();

    yPos += 10;
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666')
      .text('¡Gracias por preferirnos!', { align: 'center' });
    
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666')
      .text('Gramas y Suministros - Calidad que transforma espacios', { align: 'center' });

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

  // ✅ ACTUALIZAR ESTADO CON RESTA DE STOCK
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

    // ✅ Si se cambia a "entregado", restar stock
    if (estado === 'entregado' && cotizacion.estado !== 'entregado') {
      await this.restarStockCotizacion(cotizacion);
    }

    // ✅ Si se cambia de "entregado" a otro estado, devolver stock
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

  // ✅ Método para restar stock (CORREGIDO)
  private async restarStockCotizacion(cotizacion: Cotizacion) {
    for (const detalle of cotizacion.detalles) {
      // Buscar el stock del producto
      const stockRegistro = await this.stockRepo.findOne({
        where: { id_producto: detalle.idProducto },
      });

      if (!stockRegistro) {
        throw new NotFoundException(`Stock para producto ID ${detalle.idProducto} no encontrado`);
      }

      // Verificar que hay suficiente stock
      if (stockRegistro.cantidad_actual < detalle.cantidad) {
        const producto = await this.productoRepo.findOne({
          where: { id_producto: detalle.idProducto },
        });
        throw new BadRequestException(
          `Stock insuficiente para "${producto?.nombre || 'Producto'}". Disponible: ${stockRegistro.cantidad_actual}, Requerido: ${detalle.cantidad}`
        );
      }

      // ✅ Restar stock en la tabla stock
      await this.stockRepo
        .createQueryBuilder()
        .update(stock)
        .set({ 
          cantidad_actual: () => `cantidad_actual - ${detalle.cantidad}`,
          ultima_actualizacion: () => 'CURRENT_TIMESTAMP',
        })
        .where('id_producto = :id', { id: detalle.idProducto })
        .execute();

      // Registrar movimiento de salida
      await this.registrarMovimiento(
        detalle.idProducto,
        detalle.cantidad,
        'salida',
        `Venta por cotización #${cotizacion.idCotizacion}`,
        cotizacion.idUsuario,
      );
    }
  }

  // ✅ Método para devolver stock (CORREGIDO)
  private async devolverStockCotizacion(cotizacion: Cotizacion) {
    for (const detalle of cotizacion.detalles) {
      // ✅ Devolver stock en la tabla stock
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

  // ✅ Método para registrar movimiento
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

    return {
      total,
      pendiente,
      pagado,
      entregado,
      cancelado,
      ventasTotales,
      ultimoMes,
      ultimaSemana,
    };
  }
}