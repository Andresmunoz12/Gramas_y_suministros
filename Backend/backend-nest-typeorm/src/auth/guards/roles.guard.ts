import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<number[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no requiere ningún rol particular, permitimos el acceso
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Si no hay usuario o no tiene rol, denegar
    if (!user || user.rol === undefined || user.rol === null) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso. (El token no contiene un rol válido para validar)',
      );
    }

    // Validar si el rol del usuario está entre los roles requeridos, normalizando a Number () para evitar fallos si llega como string en el payload
    const hasRole = requiredRoles.some((role) => Number(role) === Number(user.rol));
    if (!hasRole) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso con tu rol actual.',
      );
    }

    return true;
  }
}
