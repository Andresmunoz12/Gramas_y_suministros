import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
export declare class ProveedoresController {
    private readonly proveedoresService;
    constructor(proveedoresService: ProveedoresService);
    crear(dto: CreateProveedorDto): Promise<import("./proveedores.entity").proveedor>;
    listar(): Promise<import("./proveedores.entity").proveedor[]>;
    obtenerUno(id: number): Promise<import("./proveedores.entity").proveedor>;
    actualizar(id: number, dto: UpdateProveedorDto): Promise<import("./proveedores.entity").proveedor>;
    borrar(id: number): Promise<import("./proveedores.entity").proveedor>;
}
