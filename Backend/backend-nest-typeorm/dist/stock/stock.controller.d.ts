import { StockService } from './stock.service';
export declare class StockController {
    private readonly stockService;
    constructor(stockService: StockService);
    verTodo(): Promise<import("./stock.entity").stock[]>;
    verUno(id: number): Promise<import("./stock.entity").stock>;
}
