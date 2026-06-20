import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { productos } from '../productos/productos.entity';
import { usuario } from '../Usuarios/usuarios.entity'; // Ajusta la ruta si es necesario
import { entrada } from './entrada.entity';
import { salida } from './salida.entity';

@Entity('movimiento')
export class movimiento {
  @PrimaryGeneratedColumn({ name: 'id_movimiento' })
  id_movimiento: number;

  @ManyToOne(() => productos)
  @JoinColumn({ name: 'id_producto' })
  producto: productos;

  @Column({ name: 'id_producto' })
  id_producto: number;

  @ManyToOne(() => usuario)
  @JoinColumn({ name: 'id_usuario' })
  usuario: usuario;

  @Column({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  detalle: string;

  @Column({ type: 'enum', enum: ['entrada', 'salida'], nullable: true })
  tipo: 'entrada' | 'salida';

  @OneToOne(() => entrada, (entrada) => entrada.movimiento, { cascade: true })
  entrada: entrada;

  @OneToOne(() => salida, (salida) => salida.movimiento, { cascade: true })
  salida: salida;
}
