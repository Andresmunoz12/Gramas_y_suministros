import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Ajusta la ruta a tu guard
import { MovimientosService } from './movimiento.service';
import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';

@ApiTags('Movimientos')
@ApiBearerAuth('access-token') // Indica a Swagger que estos endpoints requieren Token
@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientosService: MovimientosService) { }

  @Post('entrada')
  @ApiOperation({ summary: 'Registrar entrada (Requiere Token)' })
  @ApiResponse({
    status: 201,
    description: 'se genero la entrada correctamente',
    schema: {
      example: {
        mensaje: 'Entrada de grama registrada exitosamente',
        id: 10,
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
    description: 'provedor no encontrado',
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
  async crearEntrada(@Body() dto: CreateMovimientoEntradaDto) {
    return await this.movimientosService.registrarEntrada(dto);
  }

  @Post('salida')
  @ApiOperation({ summary: 'Registrar salida (Requiere Token)' })
  @ApiResponse({
    status: 201,
    description: 'se genero la salida correctamente',
    schema: {
      example: {
        mensaje: 'salida de grama registrada exitosamente',
        id: 10,
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
    description: 'provedor no encontrado',
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
  async crearSalida(@Body() dto: CreateMovimientoSalidaDto) {
    return await this.movimientosService.registrarSalida(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Ver historial (Requiere Token)' })
  async obtenerHistorial() {
    return await this.movimientosService.findAll();
  }
}
