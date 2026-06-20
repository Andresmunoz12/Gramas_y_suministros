// src/reportes/reportes.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Roles(1)
  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen general del sistema' })
  async getResumenGeneral() {
    return this.reportesService.getResumenGeneral();
  }

  @Roles(1)
  @Get('usuarios/nuevos')
  @ApiOperation({ summary: 'Usuarios registrados en un rango de fechas' })
  @ApiQuery({ name: 'inicio', required: true, example: '2024-06-01' })
  @ApiQuery({ name: 'fin', required: true, example: '2024-06-10' })
  async getUsuariosNuevos(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string
  ) {
    return this.reportesService.getUsuariosNuevos(inicio, fin);
  }

  @Roles(1)
  @Get('productos/nuevos')
  @ApiOperation({ summary: 'Productos registrados en un rango de fechas' })
  @ApiQuery({ name: 'inicio', required: true, example: '2024-06-01' })
  @ApiQuery({ name: 'fin', required: true, example: '2024-06-10' })
  async getProductosNuevos(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string
  ) {
    return this.reportesService.getProductosNuevos(inicio, fin);
  }

  @Roles(1)
  @Get('stock-critico')
  @ApiOperation({ summary: 'Productos sin stock y con stock bajo' })
  async getStockCritico() {
    return this.reportesService.getStockCritico();
  }

  @Roles(1)
  @Get('usuarios-en-linea')
  @ApiOperation({ summary: 'Usuarios que han iniciado sesión hoy' })
  async getUsuariosEnLinea() {
    return this.reportesService.getUsuariosEnLinea();
  }
}