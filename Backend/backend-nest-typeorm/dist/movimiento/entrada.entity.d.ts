import { movimiento } from './movimiento.entity';
import { proveedor } from '../proveedores/proveedores.entity';
export declare class entrada {
    id_movimiento: number;
    movimiento: movimiento;
    proveedor: proveedor;
    id_proveedor: number;
    precio_unitario: number;
    lote: string;
    observaciones: string;
}
