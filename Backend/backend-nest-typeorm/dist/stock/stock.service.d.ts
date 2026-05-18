import { Repository, EntityManager } from 'typeorm';
import { stock } from './stock.entity';
export declare class StockService {
    private readonly stockRepo;
    constructor(stockRepo: Repository<stock>);
    findAll(): Promise<stock[]>;
    findOne(id_producto: number): Promise<stock>;
    actualizarSaldo(id_producto: number, cantidad: number, manager: EntityManager): Promise<stock>;
}
