import { Repository } from 'typeorm';
import { usuario } from '../Usuarios/usuarios.entity';
import { PasswordReset } from './password-resets.entity';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AuthService {
    private userRepo;
    private resetRepo;
    private readonly MailerService;
    constructor(userRepo: Repository<usuario>, resetRepo: Repository<PasswordReset>, MailerService: MailerService);
    solicitarRecuperacion(email: string): Promise<{
        message: string;
    }>;
    restablecerPassword(codigo: string, nuevaPassword: string): Promise<{
        message: string;
    }>;
}
