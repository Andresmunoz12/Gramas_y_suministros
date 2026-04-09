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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de que la ruta sea correcta

@ApiTags('Proveedores')
@ApiBearerAuth('access-token') // Indica que requiere Bearer Token
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo proveedor' })
  @ApiResponse({
    status: 201,
    description: 'Proveedor creado correctamente.',
    schema: {
      example: {
        mensaje: 'Entrada de grama registrada exitosamente',
        id: 9,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'no autorizado',
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
    description: 'Error en la validación de datos.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-24T20:37:17.763Z',
        path: '/movimientos/entrada',
        message: 'Proveedor no encontrado',
        errorName: 'NotFoundException',
      },
    },
  })
  async crear(@Body() dto: CreateProveedorDto) {
    return await this.proveedoresService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los proveedores' })
  @ApiResponse({
    status: 200,
    description: 'Lista obtenida con éxito.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-24T20:37:17.763Z',
        path: '/movimientos/entrada',
        message: 'Proveedor no encontrado',
        errorName: 'NotFoundException',
      },
    },
  })
  async listar() {
    return await this.proveedoresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor por ID' })
  @ApiParam({ name: 'id', description: 'ID numérico del proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado.' })
  @ApiResponse({ status: 404, description: 'Proveedor no existe.' })
  async obtenerUno(@Param('id', ParseIntPipe) id: number) {
    return await this.proveedoresService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar datos de un proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado.' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return await this.proveedoresService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un proveedor' })
  @ApiResponse({ status: 200, description: 'Proveedor eliminado.' })
  @ApiResponse({
    status: 404,
    description: 'No se pudo eliminar: ID no encontrado.',
  })
  async borrar(@Param('id', ParseIntPipe) id: number) {
    return await this.proveedoresService.remove(id);
  }
}
