// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { usuario } from '../../Usuarios/usuarios.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(usuario)
        private readonly userRepository: Repository<usuario>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_123',
        });
    }

    async validate(payload: any) {
        // ✅ Consultar el usuario en la base de datos para verificar su estado actual
        const user = await this.userRepository.findOne({
            where: { id_usuario: payload.sub },
            select: ['id_usuario', 'nombre', 'email', 'estado', 'id_rol']
        });

        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        // ✅ Verificar estado del usuario
        if (user.estado === 'inactivo') {
            throw new UnauthorizedException(
                'Tu cuenta ha sido desactivada temporalmente. Comunícate con la línea de atención al cliente.'
            );
        }

        if (user.estado === 'suspendido') {
            throw new UnauthorizedException(
                'Tu cuenta ha sido suspendida. Contacta al administrador del sistema.'
            );
        }

        // ✅ Retornar el usuario con toda la información necesaria
        return {
            userId: user.id_usuario,
            email: user.email,
            nombre: user.nombre,
            rol: user.id_rol,
            estado: user.estado, // Incluimos el estado por si se necesita en el guard
        };
    }
}