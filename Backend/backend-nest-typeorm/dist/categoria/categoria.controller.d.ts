import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria-dto';
export declare class CategoriaController {
    private readonly categoriaService;
    constructor(categoriaService: CategoriaService);
    create(createCategoriaDto: CreateCategoriaDto): Promise<import("./categoria.entity").categoria>;
    findAll(): Promise<import("./categoria.entity").categoria[]>;
    findOne(id: number): Promise<import("./categoria.entity").categoria>;
    update(id: number, updateCategoriaDto: CreateCategoriaDto): Promise<import("./categoria.entity").categoria & CreateCategoriaDto>;
    remove(id: number): Promise<import("./categoria.entity").categoria>;
}
