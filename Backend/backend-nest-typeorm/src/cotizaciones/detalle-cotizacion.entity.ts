// src/cotizaciones/detalle-cotizacion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cotizacion } from './cotizacion.entity';
import { productos } from '../productos/productos.entity';

@Entity('detalle_cotizacion')
export class DetalleCotizacion {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  idDetalle: number;

  @Column({ name: 'id_cotizacion' })
  idCotizacion: number;

  @ManyToOne(() => Cotizacion, (cotizacion) => cotizacion.detalles)
  @JoinColumn({ name: 'id_cotizacion' })
  cotizacion: Cotizacion;

  @Column({ name: 'id_producto' })
  idProducto: number;

  @ManyToOne(() => productos)
  @JoinColumn({ name: 'id_producto' })
  producto: productos;

  @Column({ type: 'int', default: 1 })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}