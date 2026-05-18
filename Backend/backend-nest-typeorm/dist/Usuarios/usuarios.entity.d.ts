import { rol } from '../roles/roles.entity';
export declare class usuario {
    id_usuario: number;
    nombre: string;
    apellido: string;
    email: string;
    passwordHash: string;
    estado: string;
    id_rol: number;
    rol: rol;
    createdAt: Date;
    updatedAt: Date;
}
