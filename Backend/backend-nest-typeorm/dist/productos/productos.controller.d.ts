import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto-dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
export declare class ProductosController {
    private readonly productosService;
    constructor(productosService: ProductosService);
    create(createProductoDto: CreateProductoDto, file?: Express.Multer.File): Promise<import("./productos.entity").productos>;
    findAll(): Promise<import("./productos.entity").productos[]>;
    findAllAdmin(): Promise<import("./productos.entity").productos[]>;
    findOne(id: number): Promise<import("./productos.entity").productos>;
    desactivar(id: number): Promise<import("./productos.entity").productos>;
    activar(id: number): Promise<import("./productos.entity").productos>;
    update(id: number, updateProductoDto: UpdateProductoDto, file?: Express.Multer.File): Promise<import("./productos.entity").productos>;
    remove(id: number): Promise<{
        mensaje: string;
    }>;
}
