// src/cotizaciones/cotizaciones.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesController } from './cotizaciones.controller';
import { CotizacionesService } from './cotizaciones.service';
import { Cotizacion } from './cotizacion.entity';
import { DetalleCotizacion } from './detalle-cotizacion.entity';
import { productos } from '../productos/productos.entity';
import { movimiento } from '../movimiento/movimiento.entity';
import { stock } from '../stock/stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cotizacion, DetalleCotizacion, productos, movimiento, stock])],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}