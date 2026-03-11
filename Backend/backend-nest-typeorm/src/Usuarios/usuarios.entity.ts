import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { rol } from '../roles/roles.entity';

@Entity('usuario')
export class usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', length: 100, nullable: true })
  apellido: string;

  @Column({ name: 'email', length: 150, unique: true })
  email: string;

  @Column({ select: false, name: 'password_hash', length: 255, nullable: true })
  passwordHash: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ['activo', 'inactivo', 'suspendido'],
    default: 'activo',
  })
  estado: string;

  @Column({ name: 'id_rol' })
  id_rol: number;

  // --- ESTA PARTE QUITA EL ERROR EN ROL.ENTITY ---
  @ManyToOne(() => rol, (r) => r.usuario)
  @JoinColumn({ name: 'id_rol' }) // Mapea la FK física de tu imagen
  rol: rol;
  // -----------------------------------------------

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
