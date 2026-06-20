import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { movimiento } from './movimiento.entity';

@Entity('salida')
export class salida {
  @PrimaryColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @OneToOne(() => movimiento, (movimiento) => movimiento.salida, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_movimiento' })
  movimiento: movimiento;

  @Column({ length: 150, nullable: true })
  destino: string;

  @Column({ length: 255, nullable: true })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}
