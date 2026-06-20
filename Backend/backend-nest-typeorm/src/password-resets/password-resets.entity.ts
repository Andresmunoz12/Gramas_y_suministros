import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'codigo' })
  codigo: string; // Coincide con tu columna 'codigo'

  @CreateDateColumn({ name: 'Tiempo' }) // Mapea la propiedad al nombre 'Tiempo' de tu SQL
  tiempo: Date;

  @Column({ name: 'usado', default: 0 })
  usado: number; // En MySQL tinyint(1) se maneja como number o boolean
}
