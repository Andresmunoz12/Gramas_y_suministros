import { Repository, DataSource } from 'typeorm';
import { movimiento } from './movimiento.entity';
import { entrada } from './entrada.entity';
import { salida } from './salida.entity';
import { StockService } from '../stock/stock.service';
import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';
import { productos } from '../productos/productos.entity';
import { usuario } from '../Usuarios/usuarios.entity';
import { proveedor } from '../proveedores/proveedores.entity';
export declare class MovimientosService {
    private movRepo;
    private entRepo;
    private salRepo;
    private prodRepo;
    private userRepo;
    private provRepo;
    private readonly stockService;
    private dataSource;
    constructor(movRepo: Repository<movimiento>, entRepo: Repository<entrada>, salRepo: Repository<salida>, prodRepo: Repository<productos>, userRepo: Repository<usuario>, provRepo: Repository<proveedor>, stockService: StockService, dataSource: DataSource);
    registrarEntrada(dto: CreateMovimientoEntradaDto): Promise<{
        mensaje: string;
        id: number;
    }>;
    registrarSalida(dto: CreateMovimientoSalidaDto): Promise<{
        mensaje: string;
        id: number;
    }>;
    findAll(): Promise<movimiento[]>;
}
