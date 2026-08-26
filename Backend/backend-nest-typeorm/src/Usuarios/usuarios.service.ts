// src/Usuarios/usuarios.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { usuario } from './usuarios.entity';
import { CreateUsuarioDto } from './dto/create-usurio-dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(usuario)
    private readonly userRepository: Repository<usuario>,
  ) {}

  async crearUsuario(datos: CreateUsuarioDto) {
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

  // ✅ NUEVO: OBTENER USUARIO POR ID
  async findOne(id: number): Promise<usuario> {
    const usuario = await this.userRepository.findOne({
      where: { id_usuario: id },
      relations: ['rol'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return usuario;
  }

  async buscarUsuarioFiltro(query: {
    nombre?: string;
    apellido?: string;
    email?: string;
    id?: number;
  }) {
    const { nombre, apellido, email, id } = query;

    const busqueda: any = {};
    if (id) busqueda.id_usuario = id;
    if (nombre) busqueda.nombre = nombre;
    if (apellido) busqueda.apellido = apellido;
    if (email) busqueda.email = email;

    const usuarioEncontrado = await this.userRepository.findOne({
      where: busqueda,
      relations: ['rol'],
    });

    if (!usuarioEncontrado) {
      return { mensaje: 'Usuario no encontrado con esos criterios' };
    }

    return usuarioEncontrado;
  }

  async eliminarUsuario(id: number) {
    const usuario = await this.userRepository.findOne({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // No permitir eliminar el último administrador
    if (usuario.id_rol === 1) {
      const adminCount = await this.userRepository.count({
        where: { id_rol: 1 },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'No se puede eliminar el último administrador del sistema. En su lugar, puedes desactivarlo.',
        );
      }
    }

    usuario.estado = 'inactivo';
    await this.userRepository.save(usuario);

    return {
      mensaje: `Usuario con ID ${id} ha sido desactivado (no eliminado)`,
      borrado: false,
      desactivado: true,
    };
  }

  async actualizarUsuario(id: number, datos: Partial<CreateUsuarioDto>) {
  // Buscar el usuario primero
  const usuario = await this.userRepository.findOne({
    where: { id_usuario: id }
  });

  if (!usuario) {
    throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
  }

  // Si hay contraseña, hashearla
  if (datos.password_hash) {
    const salt = await bcrypt.genSalt(10);
    datos.password_hash = await bcrypt.hash(datos.password_hash, salt);
  }

  // Actualizar los campos
  if (datos.nombre) usuario.nombre = datos.nombre;
  if (datos.apellido) usuario.apellido = datos.apellido;
  if (datos.email) usuario.email = datos.email;
  if (datos.id_rol) usuario.id_rol = datos.id_rol;
  if (datos.password_hash) usuario.passwordHash = datos.password_hash;

  // Guardar cambios
  await this.userRepository.save(usuario);

  // ✅ Devolver el usuario actualizado COMPLETO
  return {
    ...usuario,
    mensaje: 'Usuario actualizado con éxito',
    actualizado: true
  };
}

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: [
        'id_usuario',
        'nombre',
        'email',
        'passwordHash',
        'id_rol',
        'estado',
      ],
    });
  }

  async cambiarEstado(id: number, estado: string) {
    const usuario = await this.userRepository.findOne({
      where: { id_usuario: id },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    const estadosValidos = ['activo', 'inactivo', 'suspendido'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException(
        `Estado no válido. Debe ser: ${estadosValidos.join(', ')}`,
      );
    }

    // No permitir desactivar al último administrador
    if (estado === 'inactivo' && usuario.id_rol === 1) {
      const adminCount = await this.userRepository.count({
        where: { id_rol: 1, estado: 'activo' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'No puedes desactivar al último administrador activo del sistema.',
        );
      }
    }

    usuario.estado = estado;
    await this.userRepository.save(usuario);

    return {
      mensaje: `Usuario ${usuario.nombre} ${estado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
      id_usuario: usuario.id_usuario,
      nuevo_estado: estado,
    };
  }
}