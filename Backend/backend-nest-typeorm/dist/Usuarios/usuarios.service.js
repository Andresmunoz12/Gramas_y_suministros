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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuarios_entity_1 = require("./usuarios.entity");
const bcrypt = __importStar(require("bcryptjs"));
let UsuariosService = class UsuariosService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async crearUsuario(datos) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(datos.password_hash, salt);
        const nuevoUsuario = this.userRepository.create({
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            passwordHash: hash,
            id_rol: datos.id_rol,
        });
        return await this.userRepository.save(nuevoUsuario);
    }
    async obtenerUsuarios() {
        return await this.userRepository.find({
            relations: ['rol'],
        });
    }
    async buscarUsuarioFiltro(query) {
        const { nombre, apellido, email, id } = query;
        const busqueda = {};
        if (id)
            busqueda.id_usuario = id;
        if (nombre)
            busqueda.nombre = nombre;
        if (apellido)
            busqueda.apellido = apellido;
        if (email)
            busqueda.email = email;
        const usuarioEncontrado = await this.userRepository.findOne({
            where: busqueda,
            relations: ['rol'],
        });
        if (!usuarioEncontrado) {
            return { mensaje: 'Usuario no encontrado con esos criterios' };
        }
        return usuarioEncontrado;
    }
    async eliminarUsuario(id) {
        const resultado = await this.userRepository.delete(id);
        if (resultado.affected === 0) {
            return { mensaje: `El usuario con ID ${id} no existe`, borrado: false };
        }
        return {
            mensaje: `Usuario con ID ${id} eliminado correctamente`,
            borrado: true,
        };
    }
    async actualizarUsuario(id, datos) {
        if (datos.password_hash) {
            const salt = await bcrypt.genSalt(10);
            datos.password_hash = await bcrypt.hash(datos.password_hash, salt);
        }
        const resultado = await this.userRepository.update(id, {
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            passwordHash: datos.password_hash,
            rol: datos.id_rol ? { id_rol: datos.id_rol } : undefined,
        });
        if (resultado.affected === 0) {
            return { mensaje: 'Usuario no encontrado', actualizado: false };
        }
        return { mensaje: 'Usuario actualizado con éxito', actualizado: true };
    }
    async findByEmailWithPassword(email) {
        return await this.userRepository.findOne({
            where: { email },
            select: ['id_usuario', 'nombre', 'email', 'passwordHash', 'id_rol'],
        });
    }
    async cambiarEstado(id, estado) {
        const usuario = await this.userRepository.findOne({
            where: { id_usuario: id }
        });
        if (!usuario) {
            throw new common_1.NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        const estadosValidos = ['activo', 'inactivo', 'suspendido'];
        if (!estadosValidos.includes(estado)) {
            throw new Error(`Estado no válido. Debe ser: ${estadosValidos.join(', ')}`);
        }
        usuario.estado = estado;
        return await this.userRepository.save(usuario);
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuarios_entity_1.usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map