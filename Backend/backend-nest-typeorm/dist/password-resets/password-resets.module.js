"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const password_resets_entity_1 = require("./password-resets.entity");
const usuarios_entity_1 = require("../Usuarios/usuarios.entity");
const password_resets_service_1 = require("./password-resets.service");
const password_resets_controller_1 = require("./password-resets.controller");
const mailer_1 = require("@nestjs-modules/mailer");
let PasswordResetsModule = class PasswordResetsModule {
};
exports.PasswordResetsModule = PasswordResetsModule;
exports.PasswordResetsModule = PasswordResetsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([usuarios_entity_1.usuario, password_resets_entity_1.PasswordReset]),
            mailer_1.MailerModule.forRoot({
                transport: {
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'gramasysuministros.sas@gmail.com',
                        pass: 'ffnxtojmottsdczs',
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                },
                defaults: {
                    from: '"Soporte Gramas" <gramasysuministros.sas@gmail.com>',
                },
            }),
        ],
        controllers: [password_resets_controller_1.AuthController],
        providers: [password_resets_service_1.AuthService],
    })
], PasswordResetsModule);
//# sourceMappingURL=password-resets.module.js.map