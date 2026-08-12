// src/cotizaciones/cotizaciones.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CotizacionesService } from './cotizaciones.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { Response } from 'express';

@ApiTags('Cotizaciones')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cotización' })
  async crearCotizacion(@Req() req: any, @Body() dto: CrearCotizacionDto) {
    const usuarioId = req.user.userId;
    return this.cotizacionesService.crearCotizacion(usuarioId, dto);
  }

  @Get('mis-cotizaciones')
  @ApiOperation({ summary: 'Obtener cotizaciones del usuario autenticado' })
  async obtenerMisCotizaciones(@Req() req: any) {
    const usuarioId = req.user.userId;
    return this.cotizacionesService.obtenerCotizacionesUsuario(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una cotización específica' })
  async obtenerCotizacion(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cotizacionesService.obtenerCotizacionCompleta(id, req.user);
  }

  @Post(':id/pagar')
  @ApiOperation({ summary: 'Simular pago de una cotización' })
  async simularPago(@Param('id', ParseIntPipe) id: number) {
    return this.cotizacionesService.simularPago(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar cotización en PDF' })
  async descargarPDF(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    return this.cotizacionesService.generarPDF(id, req.user, res);
  }

  // 👇 ENDPOINTS PARA ADMINISTRADOR
  @Roles(1)
  @Get('admin/todas')
  @ApiOperation({ summary: 'Obtener todas las cotizaciones (Admin)' })
  @ApiQuery({ name: 'estado', required: false, enum: ['pendiente', 'pagado', 'entregado', 'cancelado'] })
  @ApiQuery({ name: 'fechaInicio', required: false, type: String })
  @ApiQuery({ name: 'fechaFin', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async obtenerTodasCotizaciones(
    @Req() req: any,
    @Query('estado') estado?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('search') search?: string,
  ) {
    return this.cotizacionesService.obtenerTodasCotizaciones({
      estado,
      fechaInicio,
      fechaFin,
      search,
    });
  }

  @Roles(1)
  @Patch('admin/:id/estado')
  @ApiOperation({ summary: 'Actualizar estado de una cotización (Admin)' })
  async actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEstadoDto,
  ) {
    return this.cotizacionesService.actualizarEstado(id, dto.estado);
  }

  @Roles(1)
  @Get('admin/estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de cotizaciones (Admin)' })
  async obtenerEstadisticas() {
    return this.cotizacionesService.obtenerEstadisticas();
  }
}