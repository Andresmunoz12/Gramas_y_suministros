import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { categoria } from '../categoria/categoria.entity';

@Entity('producto')
export class productos {
  @PrimaryGeneratedColumn({ name: 'id_producto' })
  id_producto: number;
  @Column({ name: 'nombre', type: 'varchar', length: 150 })
  nombre: string;
  @Column({ name: 'marca', type: 'varchar', length: 100 })
  marca: string;
  @Column({
    name: 'peso',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
  })
  peso: number;
  @Column({ name: 'material', type: 'varchar', length: 100 })
  material: string;
  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;
  @Column({
    name: 'precio',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  precio: number;
  @Column({
    name: 'altura',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  altura: number;
  @ManyToOne(() => categoria, (c) => c.productos)
  @JoinColumn({ name: 'id_categoria' })
  categoria: categoria;

  @Column({ name: 'imagen', type: 'varchar', length: 255, nullable: true })
  imagen: string;
  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  @Column({
    name: 'updated_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}
