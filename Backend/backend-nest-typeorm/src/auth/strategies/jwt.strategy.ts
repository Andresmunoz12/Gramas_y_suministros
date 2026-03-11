import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'SUPER_SECRET_KEY_123', // Debe coincidir con el del AuthModule
        });
    }

    async validate(payload: any) {
        // Lo que retornamos aquí se inyectará en req.user
        return {
            userId: payload.sub,
            email: payload.email,
            rol: payload.rol
        };
    }
}
