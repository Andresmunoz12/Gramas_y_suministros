import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { movimiento } from './movimiento.entity';
import { proveedor } from '../proveedores/proveedores.entity';

@Entity('entrada')
export class entrada {
  @PrimaryColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @OneToOne(() => movimiento, (movimiento) => movimiento.entrada, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: movimiento;

  @ManyToOne(() => proveedor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_proveedor' })
  proveedor: proveedor;

  @Column({ name: 'id_proveedor', nullable: true })
  id_proveedor: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'precio_unitario',
  })
  precio_unitario: number;

  @Column({ length: 100, nullable: true })
  lote: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}
