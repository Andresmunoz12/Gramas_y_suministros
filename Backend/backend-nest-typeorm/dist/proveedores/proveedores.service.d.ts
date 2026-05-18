import { Repository } from 'typeorm';
import { proveedor } from './proveedores.entity';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
export declare class ProveedoresService {
    private readonly repo;
    constructor(repo: Repository<proveedor>);
    findAll(): Promise<proveedor[]>;
    findOne(id: number): Promise<proveedor>;
    create(data: Partial<proveedor>): Promise<proveedor>;
    update(id: number, dto: UpdateProveedorDto): Promise<proveedor>;
    remove(id: number): Promise<proveedor>;
}
