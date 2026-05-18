import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol-dto';
import { UpdateRolDto } from './dto/update-rol-dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRolDto: CreateRolDto): Promise<import("./roles.entity").rol>;
    findAll(): Promise<import("./roles.entity").rol[]>;
    findOne(id: number): Promise<import("./roles.entity").rol>;
    update(id: number, updateRolDto: UpdateRolDto): Promise<import("./roles.entity").rol>;
    remove(id: number): Promise<import("./roles.entity").rol>;
}
