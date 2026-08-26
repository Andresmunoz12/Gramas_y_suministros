// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsuariosService } from '../Usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly jwtService: JwtService,
        @InjectRepository(usuario)
        private readonly userRepository: Repository<usuario>,
    ) { }

    async login(email: string, pass: string) {
        const user = await this.usuariosService.findByEmailWithPassword(email);

        if (!user || !pass) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // ✅ VERIFICAR EL ESTADO DEL USUARIO ANTES DE VALIDAR CONTRASEÑA
        if (user.estado === 'inactivo') {
            throw new BadRequestException(
                'Tu cuenta ha sido desactivada temporalmente. Comunícate con la línea de atención al cliente para más información.'
            );
        }

        if (user.estado === 'suspendido') {
            throw new BadRequestException(
                'Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema.'
            );
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);

        if (!isMatch) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // ✅ Actualizar último login
        await this.userRepository.update(user.id_usuario, {
            ultimoLogin: new Date()
        });

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
                email: user.email,
                id_rol: user.id_rol
            }
        };
    }
}