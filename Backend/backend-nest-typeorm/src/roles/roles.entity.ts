import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';

@Entity('rol')
export class rol {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: ['administrador', 'cliente', 'almacenista'],
  })
  tipo: string;

  @Column({ name: 'descripcion', nullable: true })
  descripcion: string;

  @OneToMany(() => usuario, (u) => u.rol)
  usuario: usuario[];
}
