"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuarios_entity_1 = require("../Usuarios/usuarios.entity");
const password_resets_entity_1 = require("./password-resets.entity");
const mailer_1 = require("@nestjs-modules/mailer");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    userRepo;
    resetRepo;
    MailerService;
    constructor(userRepo, resetRepo, MailerService) {
        this.userRepo = userRepo;
        this.resetRepo = resetRepo;
        this.MailerService = MailerService;
    }
    async solicitarRecuperacion(email) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('El correo no está registrado');
        const nuevoCodigo = Math.floor(100000 + Math.random() * 900000).toString();
        const reset = this.resetRepo.create({
            email: email,
            codigo: nuevoCodigo,
            usado: 0,
        });
        await this.resetRepo.save(reset);
        await this.MailerService.sendMail({
            to: email,
            subject: 'Tu código de recuperación - Gramas y Suministros',
            html: `
        <div style="margin: 0; padding: 0; background-color: #f9f9f9; padding-top: 20px; padding-bottom: 20px;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; font-family: 'Segoe UI', Arial, sans-serif; border: 1px solid #e0e0e0;">
            
            <tr>
              <td style="background-color: #7cd36d; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                  Gramas y Suministros
                </h1>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 20px; text-align: center;">
                <h2 style="color: #333333; margin: 0 0 15px 0; font-size: 22px;">Verificación de Identidad</h2>
                <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 auto; max-width: 450px;">
                  Has solicitado un código para restablecer tu contraseña. Utiliza los siguientes números para completar el proceso:
                </p>
                
                <div style="margin: 35px 0;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color: #f0fdf4; border: 2px dashed #7cd36d; border-radius: 4px; padding: 15px 30px;">
                        <span style="font-size: 36px; font-weight: bold; color: #2d5a27; letter-spacing: 10px; font-family: monospace;">
                          ${nuevoCodigo}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <p style="color: #888888; font-size: 13px; margin-top: 20px;">
                  Este código expirará pronto. Si no has solicitado este cambio, por favor ignora este correo.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
                <p style="margin: 0;">&copy; 2026 <b>Gramas y Suministros S.A.S.</b></p>
                <p style="margin: 5px 0 0 0;">Soacha, Cundinamarca, Colombia.</p>
              </td>
            </tr>

          </table>
        </div>
      `,
        });
        console.log(`CÓDIGO GENERADO Y ENVIADO A: ${email}`);
        return { message: 'Código enviado con éxito al correo' };
    }
    async restablecerPassword(codigo, nuevaPassword) {
        const registro = await this.resetRepo.findOne({
            where: { codigo, usado: 0 },
        });
        if (!registro)
            throw new common_1.BadRequestException('Código inválido o ya usado');
        const user = await this.userRepo.findOne({
            where: { email: registro.email },
        });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        user.passwordHash = await bcrypt.hash(nuevaPassword, 10);
        await this.userRepo.save(user);
        registro.usado = 1;
        await this.resetRepo.save(registro);
        return { message: 'Contraseña actualizada correctamente' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuarios_entity_1.usuario)),
    __param(1, (0, typeorm_1.InjectRepository)(password_resets_entity_1.PasswordReset)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_1.MailerService])
], AuthService);
//# sourceMappingURL=password-resets.service.js.map