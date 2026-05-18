"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const usuarios_module_1 = require("./Usuarios/usuarios.module");
const typeorm_1 = require("@nestjs/typeorm");
const roles_module_1 = require("./roles/roles.module");
const productos_module_1 = require("./productos/productos.module");
const categoria_module_1 = require("./categoria/categoria.module");
const password_resets_module_1 = require("./password-resets/password-resets.module");
const stock_module_1 = require("./stock/stock.module");
const movimiento_module_1 = require("./movimiento/movimiento.module");
const proveedores_module_1 = require("./proveedores/proveedores.module");
const auth_module_1 = require("./auth/auth.module");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const serve_static_1 = require("@nestjs/serve-static");
const logger_middleware_1 = require("./auth/middleware/logger/logger.middleware");
const path_1 = require("path");
const roles_guard_1 = require("./auth/guards/roles.guard");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(logger_middleware_1.LoggerMiddleware)
            .forRoutes({ path: '*', method: common_1.RequestMethod.ALL });
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: 'db_gramas',
                port: 3306,
                username: 'root',
                password: 'admin_password',
                database: 'gramas_db',
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
            }),
            usuarios_module_1.UsuariosModule,
            roles_module_1.RolesModule,
            productos_module_1.ProductosModule,
            categoria_module_1.CategoriaModule,
            password_resets_module_1.PasswordResetsModule,
            stock_module_1.StockModule,
            movimiento_module_1.MovimientoModule,
            proveedores_module_1.ProveedoresModule,
            auth_module_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map