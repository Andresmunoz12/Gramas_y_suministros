// src/reportes/reportes.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Response } from 'express';

@ApiTags('Reportes')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // ============ DASHBOARD PRINCIPAL ============
  @Roles(1)
  @Get('dashboard')
  @ApiOperation({ summary: 'Obtener datos del dashboard principal' })
  async getDashboard() {
    return this.reportesService.getDashboard();
  }

  // ============ REPORTES DE USUARIOS ============
  @Roles(1)
  @Get('usuarios/resumen')
  @ApiOperation({ summary: 'Resumen de usuarios' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiQuery({ name: 'estado', required: false })
  async getResumenUsuarios(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estado') estado?: string,
  ) {
    return this.reportesService.getResumenUsuarios({
      fechaInicio,
      fechaFin,
      estado,
    });
  }

  @Roles(1)
  @Get('usuarios/nuevos-por-dia')
  @ApiOperation({ summary: 'Usuarios nuevos por día' })
  @ApiQuery({ name: 'fechaInicio', required: true })
  @ApiQuery({ name: 'fechaFin', required: true })
  async getUsuariosNuevosPorDia(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getUsuariosNuevosPorDia(fechaInicio, fechaFin);
  }

  @Roles(1)
  @Get('usuarios/por-rol')
  @ApiOperation({ summary: 'Distribución de usuarios por rol' })
  async getUsuariosPorRol() {
    return this.reportesService.getUsuariosPorRol();
  }

  // ============ REPORTES DE PRODUCTOS ============
  @Roles(1)
  @Get('productos/resumen')
  @ApiOperation({ summary: 'Resumen de productos' })
  @ApiQuery({ name: 'categoria', required: false })
  @ApiQuery({ name: 'estado', required: false })
  async getResumenProductos(
    @Query('categoria') categoria?: string,
    @Query('estado') estado?: string,
  ) {
    return this.reportesService.getResumenProductos({ categoria, estado });
  }

  @Roles(1)
  @Get('productos/nuevos-por-dia')
  @ApiOperation({ summary: 'Productos nuevos por día' })
  @ApiQuery({ name: 'fechaInicio', required: true })
  @ApiQuery({ name: 'fechaFin', required: true })
  async getProductosNuevosPorDia(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getProductosNuevosPorDia(fechaInicio, fechaFin);
  }

  @Roles(1)
  @Get('productos/por-categoria')
  @ApiOperation({ summary: 'Distribución de productos por categoría' })
  async getProductosPorCategoria() {
    return this.reportesService.getProductosPorCategoria();
  }

  @Roles(1)
  @Get('productos/estado-stock')
  @ApiOperation({ summary: 'Estado del stock de productos' })
  async getEstadoStock() {
    return this.reportesService.getEstadoStock();
  }

  // ============ REPORTES DE STOCK Y MOVIMIENTOS ============
  @Roles(1)
  @Get('stock/resumen')
  @ApiOperation({ summary: 'Resumen de stock' })
  async getResumenStock() {
    return this.reportesService.getResumenStock();
  }

  @Roles(1)
  @Get('stock/movimientos')
  @ApiOperation({ summary: 'Movimientos de inventario' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  async getMovimientos(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.reportesService.getMovimientos({
      fechaInicio,
      fechaFin,
      tipo,
    });
  }

  @Roles(1)
  @Get('stock/movimientos-por-dia')
  @ApiOperation({ summary: 'Movimientos por día' })
  @ApiQuery({ name: 'fechaInicio', required: true })
  @ApiQuery({ name: 'fechaFin', required: true })
  async getMovimientosPorDia(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getMovimientosPorDia(fechaInicio, fechaFin);
  }

  // ============ REPORTES DE COTIZACIONES ============
  @Roles(1)
  @Get('cotizaciones/resumen')
  @ApiOperation({ summary: 'Resumen de cotizaciones' })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiQuery({ name: 'estado', required: false })
  async getResumenCotizaciones(
    @Res({ passthrough: true }) res: Response,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('estado') estado?: string,
  ) {
    // ✅ Headers anti-caché
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const result = await this.reportesService.getResumenCotizaciones({
      fechaInicio,
      fechaFin,
      estado,
    });

    console.log('📊 Controller - Total cotizaciones:', result.total);
    console.log('📊 Controller - Cotizaciones en detalle:', result.cotizaciones?.length);

    return result;
  }

  @Roles(1)
  @Get('cotizaciones/por-metodo')
  @ApiOperation({ summary: 'Cotizaciones por método de venta' })
  async getCotizacionesPorMetodo() {
    return this.reportesService.getCotizacionesPorMetodo();
  }

  @Roles(1)
  @Get('cotizaciones/ventas-diarias')
  @ApiOperation({ summary: 'Ventas diarias' })
  @ApiQuery({ name: 'fechaInicio', required: true })
  @ApiQuery({ name: 'fechaFin', required: true })
  async getVentasDiarias(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getVentasDiarias(fechaInicio, fechaFin);
  }

  // ============ EXPORTACIONES ============
  @Roles(1)
  @Get('exportar/excel')
  @ApiOperation({ summary: 'Exportar reporte a Excel' })
  async exportarExcel(@Res() res: Response) {
    const buffer = await this.reportesService.exportarExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.status(HttpStatus.OK).send(buffer);
  }

  @Roles(1)
  @Get('exportar/pdf')
  @ApiOperation({ summary: 'Exportar reporte a PDF' })
  async exportarPDF(@Res() res: Response) {
    return this.reportesService.exportarPDF(res);
  }
}