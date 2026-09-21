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
  codigo: string;

  @CreateDateColumn({
    name: 'tiempo',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  tiempo: Date;

  @Column({ name: 'usado', default: 0 })
  usado: number;
}
