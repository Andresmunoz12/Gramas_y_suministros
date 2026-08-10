import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { MovimientosService } from './movimiento.service';

import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';

@ApiTags('Movimientos')
@ApiBearerAuth('access-token')
@Controller('movimientos')
export class MovimientoController {
  constructor(
    private readonly movimientosService: MovimientosService,
  ) {}

  // =====================================================
  // REGISTRAR ENTRADA
  // SOLO ADMINISTRADORES
  // =====================================================

  @Post('entrada')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @ApiOperation({
    summary: 'Registrar entrada de inventario',
    description:
      'Permite registrar una entrada de inventario únicamente a usuarios con rol Administrador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Entrada registrada correctamente.',
    schema: {
      example: {
        mensaje: 'Entrada de grama registrada exitosamente',
        id: 10,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Los datos enviados no cumplen las validaciones.',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. Se requiere un token JWT válido.',
    schema: {
      example: {
        statusCode: 401,
        message: 'No autorizado',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'El usuario no tiene permisos de Administrador.',
    schema: {
      example: {
        statusCode: 403,
        message:
          'No tienes permisos suficientes para acceder a este recurso con tu rol actual.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Producto, usuario o proveedor no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Proveedor no encontrado',
        error: 'Not Found',
      },
    },
  })
  async crearEntrada(
    @Body() dto: CreateMovimientoEntradaDto,
  ) {
    return await this.movimientosService.registrarEntrada(
      dto,
    );
  }

  // =====================================================
  // REGISTRAR SALIDA
  // SOLO ADMINISTRADORES
  // =====================================================

  @Post('salida')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1)
  @ApiOperation({
    summary: 'Registrar salida de inventario',
    description:
      'Permite registrar una salida de inventario únicamente a usuarios con rol Administrador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Salida registrada correctamente.',
    schema: {
      example: {
        mensaje: 'Salida de grama registrada exitosamente',
        id: 10,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Los datos enviados no cumplen las validaciones o no hay stock suficiente.',
  })
  @ApiResponse({
    status: 401,
    description:
      'No autorizado. Se requiere un token JWT válido.',
    schema: {
      example: {
        statusCode: 401,
        message: 'No autorizado',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'El usuario no tiene permisos de Administrador.',
    schema: {
      example: {
        statusCode: 403,
        message:
          'No tienes permisos suficientes para acceder a este recurso con tu rol actual.',
        error: 'Forbidden',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description:
      'Producto o usuario no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        message: 'Producto no encontrado',
        error: 'Not Found',
      },
    },
  })
  async crearSalida(
    @Body() dto: CreateMovimientoSalidaDto,
  ) {
    return await this.movimientosService.registrarSalida(
      dto,
    );
  }

  // =====================================================
  // HISTORIAL
  // =====================================================

  @Get()
  @ApiOperation({
    summary: 'Ver historial de movimientos',
  })
  @ApiResponse({
    status: 200,
    description:
      'Historial de movimientos obtenido correctamente.',
  })
  async obtenerHistorial() {
    return await this.movimientosService.findAll();
  }
}