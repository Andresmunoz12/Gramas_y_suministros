import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol-dto';
import { UpdateRolDto } from './dto/update-rol-dto';
import { Roles } from '../auth/decorators/roles.decorator'; // Tu decorador de RBAC

@ApiTags('Roles de Usuario')
@ApiBearerAuth('access-token') // Todas las rutas requieren token
@Roles(1) // Solo el Admin (Rol 1) puede gestionar roles
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // --- POST: CREAR ---
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo tipo de rol' })
  @ApiResponse({
    status: 201,
    description: 'Rol creado.',
    schema: {
      example: {
        id_rol: 3,
        tipo: 'almacenista',
        descripcion: 'Gestión de bodega',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos.',
    schema: {
      example: {
        statusCode: 400,
        message: ['El tipo debe ser administrador, cliente o almacenista'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permisos de Administrador',
        error: 'Forbidden',
      },
    },
  })
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolesService.create(createRolDto);
  }

  // --- GET: LISTAR TODOS ---
  @Get()
  @ApiOperation({ summary: 'Obtener todos los roles registrados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles.',
    schema: {
      example: [
        { id_rol: 1, tipo: 'administrador' },
        { id_rol: 2, tipo: 'cliente' },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permisos de Administrador',
        error: 'Forbidden',
      },
    },
  })
  findAll() {
    return this.rolesService.findAll();
  }

  // --- GET: BUSCAR POR ID ---
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol específico por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado.',
    schema: {
      example: {
        id_rol: 1,
        tipo: 'administrador',
        descripcion: 'Acceso total',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permisos de Administrador',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe.',
    schema: { example: { statusCode: 404, message: 'Rol no encontrado' } },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  // --- PUT: ACTUALIZAR ---
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar la descripción o tipo de un rol' })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado.',
    schema: {
      example: {
        id_rol: 2,
        tipo: 'cliente',
        descripcion: 'Usuario final del sistema',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en el JSON enviado.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Tipo de rol no permitido',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Prohibido.',
    schema: {
      example: {
        statusCode: 403,
        message: 'No tienes permisos de Administrador',
        error: 'Forbidden',
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolDto: UpdateRolDto,
  ) {
    return this.rolesService.update(id, updateRolDto);
  }

  // --- DELETE: ELIMINAR ---
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol permanentemente' })
  @ApiResponse({
    status: 200,
    description: 'Rol eliminado.',
    schema: { example: { message: 'Rol eliminado correctamente', id: 3 } },
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para borrar.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Solo el administrador puede borrar roles',
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}
