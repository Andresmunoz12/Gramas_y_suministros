import { Injectable } from '@nestjs/common';
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
  ) { }
  async crearUsuario(datos: CreateUsuarioDto) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(datos.password_hash, salt);

    const nuevoUsuario = this.userRepository.create({
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      // Usamos el nombre de la clase entidad: passwordHash
      passwordHash: hash,
      // Vinculamos el objeto rol con el ID que viene del DTO
      id_rol: datos.id_rol,
    });
    return await this.userRepository.save(nuevoUsuario);
  }

  async obtenerUsuarios() {
    return await this.userRepository.find({
      relations: ['rol'],
    });
  }
  // src/Usuarios/usuarios.service.ts

  async buscarUsuarioFiltro(query: {
    nombre?: string;
    apellido?: string;
    email?: string;
    id?: number;
  }) {
    const { nombre, apellido, email, id } = query;

    // Construimos el objeto de búsqueda dinámicamente
    const busqueda: any = {};
    if (id) busqueda.id_usuario = id;
    if (nombre) busqueda.nombre = nombre;
    if (apellido) busqueda.apellido = apellido;
    if (email) busqueda.email = email;

    const usuarioEncontrado = await this.userRepository.findOne({
      where: busqueda,
      relations: ['rol'], // Para que también traiga su rol
    });

    if (!usuarioEncontrado) {
      return { mensaje: 'Usuario no encontrado con esos criterios' };
    }

    return usuarioEncontrado;
  }

  // Añade esto al final de tu clase UsuariosService
  async eliminarUsuario(id: number) {
    // El método delete es el más directo para borrar por ID
    const resultado = await this.userRepository.delete(id);

    // Verificamos si se borró algo (affected será 1 si tuvo éxito, 0 si el ID no existía)
    if (resultado.affected === 0) {
      return { mensaje: `El usuario con ID ${id} no existe`, borrado: false };
    }

    return {
      mensaje: `Usuario con ID ${id} eliminado correctamente`,
      borrado: true,
    };
  }
  async actualizarUsuario(id: number, datos: Partial<CreateUsuarioDto>) {
    // Si el usuario envía una nueva contraseña, hay que hashearla de nuevo
    if (datos.password_hash) {
      const salt = await bcrypt.genSalt(10);
      datos.password_hash = await bcrypt.hash(datos.password_hash, salt);
    }

    // Actualizamos en la DB usando el ID
    const resultado = await this.userRepository.update(id, {
      nombre: datos.nombre,
      apellido: datos.apellido,
      email: datos.email,
      passwordHash: datos.password_hash,
      // Si envían un nuevo rol, lo mapeamos
      rol: datos.id_rol ? ({ id_rol: datos.id_rol } as any) : undefined,
    });

    if (resultado.affected === 0) {
      return { mensaje: 'Usuario no encontrado', actualizado: false };
    }

    return { mensaje: 'Usuario actualizado con éxito', actualizado: true };
  }

  async findByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: ['id_usuario', 'nombre', 'email', 'passwordHash', 'id_rol'],
    });
  }
}
