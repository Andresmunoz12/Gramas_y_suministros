import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Patch,
  BadRequestException,
  NotFoundException, // 👈 AGREGADO
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usurio-dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { usuario } from './usuarios.entity';
import { rol } from 'src/roles/roles.entity';

@ApiTags('Usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // --- POST: CREAR (SIN TOKEN) ---
  @Public()
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario (Registro público)' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente.',
    schema: {
      example: {
        id_usuario: 1,
        nombre: 'Andres Felipe',
        apellido: 'Muñoz Lombana',
        email: 'prueba@gmail.com',
        id_rol: 1,
        mensaje: 'Registro completado con éxito',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación en los datos enviados.',
    schema: {
      example: {
        message: [
          'email must be an email',
          'password_hash must be longer than or equal to 8 characters',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  crearUsuario(@Body() nuevousuario: CreateUsuarioDto) {
    return this.usuariosService.crearUsuario(nuevousuario);
  }

  // --- GET: LISTAR (CON TOKEN) ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Get()
  @ApiOperation({ summary: 'Obtener lista de todos los usuarios (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios retornada.',
    schema: {
      example: [
        {
          id_usuario: 1,
          nombre: 'Andres',
          email: 'admin@gramas.com',
          id_rol: 1,
        },
        { id_usuario: 2, nombre: 'Juan', email: 'juan@gramas.com', id_rol: 2 },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token faltante o inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Se requiere rol de Administrador.',
  })
  listarTodos() {
    return this.usuariosService.obtenerUsuarios();
  }

  // --- ✅ NUEVO: GET POR ID (CON TOKEN) ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID (Solo Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado.',
    schema: {
      example: {
        id_usuario: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@ejemplo.com',
        id_rol: 2,
        estado: 'activo',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Usuario con ID 2 no encontrado',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. Se requiere rol de Administrador.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  // --- PUT: ACTUALIZAR (CON TOKEN) ---
  @ApiBearerAuth('access-token')
  @Roles(2, 1)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de un usuario por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado.',
    schema: {
      example: {
        id_usuario: 1,
        nombre: 'Andres Modificado',
        email: 'admin@gramas.com',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No encontrado.',
    schema: { example: { statusCode: 404, message: 'Usuario no existe' } },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido. No tienes permisos suficientes.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos enviados incorrectos.',
  })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: UpdateUsuarioDto,
  ) {
    return this.usuariosService.actualizarUsuario(id, datos);
  }

  // --- DELETE: ELIMINAR (CON TOKEN) ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario del sistema' })
  @ApiResponse({
    status: 200,
    description: 'Usuario borrado.',
    schema: {
      example: { message: 'Usuario con ID 5 eliminado correctamente' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado.',
  })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.eliminarUsuario(id);
  }

  // --- PATCH: ESTADO (CON TOKEN) ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado (activo/inactivo/suspendido)' })
  @ApiResponse({
    status: 200,
    description: 'Estado cambiado.',
    schema: { example: { id_usuario: 1, nuevoEstado: 'inactivo' } },
  })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    const estadosValidos = ['activo', 'inactivo', 'suspendido'];
    if (!estadosValidos.includes(estado)) {
      throw new BadRequestException(
        `Estado no válido. Use: ${estadosValidos.join(', ')}`,
      );
    }
    return this.usuariosService.cambiarEstado(id, estado);
  }
}