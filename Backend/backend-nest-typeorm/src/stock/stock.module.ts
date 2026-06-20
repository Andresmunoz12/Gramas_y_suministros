import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { stock } from './stock.entity'; // Asegúrate de que el nombre sea minúscula si así lo llamaste
import { productos } from '../productos/productos.entity';

@Module({
  imports: [
    // Debes registrar la entidad aquí para que el repositorio funcione
    TypeOrmModule.forFeature([stock, productos]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
