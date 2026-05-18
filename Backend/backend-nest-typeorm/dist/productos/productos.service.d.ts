import { Repository } from 'typeorm';
import { productos } from './productos.entity';
import { CreateProductoDto } from './dto/create-producto-dto';
import { categoria } from '../categoria/categoria.entity';
import { UpdateProductoDto } from './dto/update-producto.dto';
export declare class ProductosService {
    private readonly productoRepository;
    private readonly categoriaRepository;
    constructor(productoRepository: Repository<productos>, categoriaRepository: Repository<categoria>);
    create(createProductoDto: CreateProductoDto): Promise<productos>;
    findAll(): Promise<productos[]>;
    findAllAdmin(): Promise<productos[]>;
    findOne(id: number): Promise<productos>;
    update(id: number, updateProductoDto: UpdateProductoDto): Promise<productos>;
    desactivar(id: number): Promise<productos>;
    activar(id: number): Promise<productos>;
    remove(id: number): Promise<{
        mensaje: string;
    }>;
}
