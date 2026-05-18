import { Repository } from 'typeorm';
import { usuario } from './usuarios.entity';
import { CreateUsuarioDto } from './dto/create-usurio-dto';
export declare class UsuariosService {
    private readonly userRepository;
    constructor(userRepository: Repository<usuario>);
    crearUsuario(datos: CreateUsuarioDto): Promise<usuario>;
    obtenerUsuarios(): Promise<usuario[]>;
    buscarUsuarioFiltro(query: {
        nombre?: string;
        apellido?: string;
        email?: string;
        id?: number;
    }): Promise<usuario | {
        mensaje: string;
    }>;
    eliminarUsuario(id: number): Promise<{
        mensaje: string;
        borrado: boolean;
    }>;
    actualizarUsuario(id: number, datos: Partial<CreateUsuarioDto>): Promise<{
        mensaje: string;
        actualizado: boolean;
    }>;
    findByEmailWithPassword(email: string): Promise<usuario | null>;
    cambiarEstado(id: number, estado: string): Promise<usuario>;
}
