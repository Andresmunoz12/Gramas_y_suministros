import { entrada } from '../movimiento/entrada.entity';
export declare class proveedor {
    id_proveedor: number;
    nombre: string;
    contacto: string;
    telefono: string;
    email: string;
    direccion: string;
    entradas: entrada[];
}
