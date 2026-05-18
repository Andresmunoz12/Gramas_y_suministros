import { productos } from '../productos/productos.entity';
export declare class categoria {
    id_categoria: number;
    nombre: string;
    descripcion: string;
    productos: productos[];
}
