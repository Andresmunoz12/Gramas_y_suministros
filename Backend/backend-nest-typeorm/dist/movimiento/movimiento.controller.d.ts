import { MovimientosService } from './movimiento.service';
import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';
export declare class MovimientoController {
    private readonly movimientosService;
    constructor(movimientosService: MovimientosService);
    crearEntrada(dto: CreateMovimientoEntradaDto): Promise<{
        mensaje: string;
        id: number;
    }>;
    crearSalida(dto: CreateMovimientoSalidaDto): Promise<{
        mensaje: string;
        id: number;
    }>;
    obtenerHistorial(): Promise<import("./movimiento.entity").movimiento[]>;
}
