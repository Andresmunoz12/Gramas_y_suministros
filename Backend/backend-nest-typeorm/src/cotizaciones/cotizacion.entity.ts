// src/cotizaciones/cotizacion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';
import { DetalleCotizacion } from './detalle-cotizacion.entity';

@Entity('cotizacion')
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: 'id_cotizacion' })
  idCotizacion: number;

  @Column({ name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: usuario;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({
    name: 'metodo_venta',
    type: 'enum',
    enum: ['fisico', 'envio'],
  })
  metodoVenta: string;

  @Column({
    name: 'metodo_pago',
    type: 'enum',
    enum: ['efectivo', 'tarjeta_debito', 'tarjeta_credito'],
  })
  metodoPago: string;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'costo_envio', type: 'decimal', precision: 10, scale: 2, default: 0 })
  costoEnvio: number;

  @Column({ name: 'total', type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'direccion_envio', length: 255, nullable: true })
  direccionEnvio: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['pendiente', 'pagado', 'entregado', 'cancelado'],
    default: 'pendiente',
  })
  estado: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'fecha_pago', type: 'datetime', nullable: true })
  fechaPago: Date;

  @OneToMany(() => DetalleCotizacion, (detalle) => detalle.cotizacion)
  detalles: DetalleCotizacion[];
}