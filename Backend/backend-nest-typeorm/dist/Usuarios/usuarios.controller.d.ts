import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usurio-dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { usuario } from './usuarios.entity';
export declare class UsuariosController {
    private readonly usuariosService;
    constructor(usuariosService: UsuariosService);
    crearUsuario(nuevousuario: CreateUsuarioDto): Promise<usuario>;
    listarTodos(): Promise<usuario[]>;
    actualizar(id: number, datos: UpdateUsuarioDto): Promise<{
        mensaje: string;
        actualizado: boolean;
    }>;
    eliminar(id: number): Promise<{
        mensaje: string;
        borrado: boolean;
    }>;
    cambiarEstado(id: number, estado: string): Promise<usuario>;
}
