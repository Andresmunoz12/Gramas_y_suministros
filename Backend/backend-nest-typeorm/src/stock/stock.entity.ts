import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { productos } from '../productos/productos.entity';

@Entity('stock')
export class stock {
  @PrimaryColumn({ name: 'id_producto' })
  id_producto: number;

  @OneToOne(() => productos)
  @JoinColumn({ name: 'id_producto' })
  producto: productos;

  @Column({ name: 'cantidad_actual', type: 'int', default: 0 })
  cantidad_actual: number;

  @Column({ name: 'nivel_minimo', type: 'int', default: 0 })
  nivel_minimo: number;

  @Column({
    name: 'ultima_actualizacion',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  ultima_actualizacion: Date;
}
