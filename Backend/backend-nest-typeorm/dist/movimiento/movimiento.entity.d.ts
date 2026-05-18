import { productos } from '../productos/productos.entity';
import { usuario } from '../Usuarios/usuarios.entity';
import { entrada } from './entrada.entity';
import { salida } from './salida.entity';
export declare class movimiento {
    id_movimiento: number;
    producto: productos;
    id_producto: number;
    usuario: usuario;
    id_usuario: number;
    fecha: Date;
    cantidad: number;
    detalle: string;
    tipo: 'entrada' | 'salida';
    entrada: entrada;
    salida: salida;
}
