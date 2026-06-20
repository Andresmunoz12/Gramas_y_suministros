import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosService } from './movimiento.service'; // Verifica que el nombre del archivo sea este
import { MovimientoController } from './movimiento.controller';
import { movimiento } from './movimiento.entity';
import { entrada } from './entrada.entity';
import { salida } from './salida.entity';
import { StockModule } from '../stock/stock.module';
import { productos } from '../productos/productos.entity';
import { usuario } from '../Usuarios/usuarios.entity';
import { proveedor } from '../proveedores/proveedores.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      movimiento,
      entrada,
      salida,
      productos,
      usuario,
      proveedor,
    ]),
    StockModule,
  ],
  controllers: [MovimientoController],
  providers: [MovimientosService],
})
export class MovimientoModule { }
