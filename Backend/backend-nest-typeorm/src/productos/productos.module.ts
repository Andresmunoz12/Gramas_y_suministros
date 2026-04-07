import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { productos } from './productos.entity';
import { categoria } from '../categoria/categoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([productos, categoria]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
