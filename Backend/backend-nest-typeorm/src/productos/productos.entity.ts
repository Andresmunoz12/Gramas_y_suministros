// src/productos/productos.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { categoria } from '../categoria/categoria.entity';
import { stock } from '../stock/stock.entity';

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

  @OneToOne(() => stock, (s) => s.producto)
  stock: stock;

  @Column({ name: 'imagen', type: 'varchar', length: 255, nullable: true })
  imagen: string;
  
  // ✅ Corregido para PostgreSQL: smallint en lugar de tinyint
  @Column({
    name: 'estado',
    type: 'smallint',
    default: 1,
    comment: '1 = Activo, 0 = Inactivo/Desactivado',
  })
  estado: number;
  
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
  
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;
}