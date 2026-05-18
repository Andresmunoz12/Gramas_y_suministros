import { UsuariosService } from '../Usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly usuariosService;
    private readonly jwtService;
    constructor(usuariosService: UsuariosService, jwtService: JwtService);
    login(email: string, pass: string): Promise<{
        access_token: string;
        user: {
            id: number;
            nombre: string;
            email: string;
            id_rol: number;
        };
    }>;
}
