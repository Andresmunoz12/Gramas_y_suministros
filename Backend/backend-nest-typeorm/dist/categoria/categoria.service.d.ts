import { Repository } from 'typeorm';
import { categoria } from './categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria-dto';
export declare class CategoriaService {
    private readonly categoriaRepository;
    constructor(categoriaRepository: Repository<categoria>);
    create(createCategoriaDto: CreateCategoriaDto): Promise<categoria>;
    findAll(): Promise<categoria[]>;
    findOne(id: number): Promise<categoria>;
    update(id: number, updateCategoriaDto: CreateCategoriaDto): Promise<categoria & CreateCategoriaDto>;
    remove(id: number): Promise<categoria>;
}
