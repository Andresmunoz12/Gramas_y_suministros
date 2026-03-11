import { Controller, Get, Post, Body } from '@nestjs/common';
import { MovimientosService } from './movimiento.service';
import { CreateMovimientoEntradaDto } from './dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from './dto/create-movimiento-salida.dto';

@Controller('movimientos')
export class MovimientoController {
  constructor(private readonly movimientosService: MovimientosService) {}

  // POST: Crear Entrada
  @Post('entrada')
  async crearEntrada(@Body() dto: CreateMovimientoEntradaDto) {
    return await this.movimientosService.registrarEntrada(dto);
  }

  // POST: Crear Salida
  @Post('salida')
  async crearSalida(@Body() dto: CreateMovimientoSalidaDto) {
    return await this.movimientosService.registrarSalida(dto);
  }

  // GET: Ver todo el historial
  @Get()
  async obtenerHistorial() {
    return await this.movimientosService.findAll();
  }
}
