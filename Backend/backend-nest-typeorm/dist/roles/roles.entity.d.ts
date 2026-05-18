import { usuario } from '../Usuarios/usuarios.entity';
export declare class rol {
    id_rol: number;
    tipo: string;
    descripcion: string;
    usuario: usuario[];
}
