import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { productos } from './productos.entity';
import { categoria } from '../categoria/categoria.entity';
import { stock } from '../stock/stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([productos, categoria, stock]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
