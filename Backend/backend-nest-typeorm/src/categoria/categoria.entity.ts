import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { productos } from '../productos/productos.entity';

@Entity('categoria')
export class categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id_categoria: number;

  @Column({ name: 'nombre', type: 'varchar', length: 100, unique: true })
  nombre: string;

  @Column({ name: 'descripcion', length: 100 })
  descripcion: string;

  // CAMBIO: Nombre en plural para reflejar que es un array
  @OneToMany(() => productos, (p) => p.categoria)
  productos: productos[];
}
