import { productos } from '../productos/productos.entity';
export declare class stock {
    id_producto: number;
    producto: productos;
    cantidad_actual: number;
    nivel_minimo: number;
    ultima_actualizacion: Date;
}
