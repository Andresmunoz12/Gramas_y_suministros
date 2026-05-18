import { AuthService } from './password-resets.service';
import { SolicitarCodigoDto } from './dto/Solicitar-codigo.dto';
import { RestablecerPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    solicitarCodigo(solicitarDto: SolicitarCodigoDto): Promise<{
        message: string;
    }>;
    restablecerPassword(restablecerDto: RestablecerPasswordDto): Promise<{
        message: string;
    }>;
}
