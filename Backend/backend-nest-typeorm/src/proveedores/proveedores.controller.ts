import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Proveedores')
@ApiBearerAuth('access-token')
@Controller('proveedores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
export class ProveedoresController {
  constructor(
    private readonly proveedoresService: ProveedoresService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo proveedor',
  })
  @ApiResponse({
    status: 201,
    description: 'Proveedor creado correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos de Administrador.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Los datos enviados no cumplen las validaciones.',
  })
  async crear(
    @Body() dto: CreateProveedorDto,
  ) {
    return await this.proveedoresService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los proveedores',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de proveedores obtenida correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos de Administrador.',
  })
  async listar() {
    return await this.proveedoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un proveedor por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del proveedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Proveedor encontrado.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos de Administrador.',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no existe.',
  })
  async obtenerUno(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.proveedoresService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar datos de un proveedor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del proveedor',
  })
  @ApiResponse({
    status: 200,
    description:
      'Proveedor actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Los datos enviados no cumplen las validaciones.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos de Administrador.',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no encontrado.',
  })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return await this.proveedoresService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un proveedor',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico del proveedor',
  })
  @ApiResponse({
    status: 200,
    description:
      'Proveedor eliminado correctamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado.',
  })
  @ApiResponse({
    status: 403,
    description:
      'No tienes permisos de Administrador.',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description:
      'No se puede eliminar porque tiene entradas asociadas.',
  })
  async borrar(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.proveedoresService.remove(id);
  }
}