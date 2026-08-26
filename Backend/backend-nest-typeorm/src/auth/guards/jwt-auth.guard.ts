// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException('No autorizado');
        }

        // ✅ Verificar estado del usuario en cada petición protegida
        // Nota: El estado viene del JWT, pero para mayor seguridad,
        // se recomienda verificar en la base de datos también.
        // Esta verificación es adicional a la que hacemos en JwtStrategy
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

        return user;
    }
}