import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('password_resets')
export class PasswordReset {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'codigo' })
  codigo: string;

  // 👇 Usar @Column en lugar de @CreateDateColumn
  @Column({
    name: 'tiempo',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  tiempo: Date;

  @Column({ name: 'usado', default: 0 })
  usado: number;
}
