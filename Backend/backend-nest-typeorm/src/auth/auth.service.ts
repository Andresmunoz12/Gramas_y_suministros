import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../Usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
    ) { }

    async login(email: string, pass: string) {
        const user = await this.usuariosService.findByEmailWithPassword(email);

        if (!user || !pass) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);

        if (!isMatch) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const payload = {
            sub: user.id_usuario,
            email: user.email,
            nombre: user.nombre,
            rol: user.id_rol
        };

        return {
            access_token: await this.jwtService.signAsync(payload),
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email
            }
        };
    }
}
