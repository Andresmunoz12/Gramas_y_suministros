import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';
import { productos } from './productos.entity'; // Asegúrate que el nombre de la clase sea Producto
import { categoria } from '../categoria/categoria.entity'; // Asegúrate que el nombre de la clase sea Categoria

@Module({
  imports: [
    // AQUÍ ESTÁ EL ERROR: Debes importar ambos repositorios
    TypeOrmModule.forFeature([productos, categoria]),
  ],
  controllers: [ProductosController],
  providers: [ProductosService],
})
export class ProductosModule {}
