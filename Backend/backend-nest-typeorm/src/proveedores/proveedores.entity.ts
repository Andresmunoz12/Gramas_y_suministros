import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { entrada } from '../movimiento/entrada.entity';

@Entity('proveedor')
export class proveedor {
  @PrimaryGeneratedColumn({ name: 'id_proveedor' })
  id_proveedor: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 150, nullable: true })
  contacto: string;

  @Column({ length: 50, nullable: true })
  telefono: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  direccion: string;

  @OneToMany(() => entrada, (entrada) => entrada.proveedor)
  entradas: entrada[];
}
