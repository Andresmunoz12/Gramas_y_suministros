import { Repository } from 'typeorm';
import { rol } from './roles.entity';
import { CreateRolDto } from './dto/create-rol-dto';
import { UpdateRolDto } from './dto/update-rol-dto';
export declare class RolesService {
    private readonly rolRepository;
    constructor(rolRepository: Repository<rol>);
    create(createRolDto: CreateRolDto): Promise<rol>;
    findAll(): Promise<rol[]>;
    update(id: number, updateRolDto: UpdateRolDto): Promise<rol>;
    findOne(id: number): Promise<rol>;
    remove(id: number): Promise<rol>;
}
