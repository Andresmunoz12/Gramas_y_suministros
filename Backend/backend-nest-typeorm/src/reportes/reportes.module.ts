// src/reportes/reportes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { usuario } from '../Usuarios/usuarios.entity';
import { productos } from '../productos/productos.entity';
import { stock } from '../stock/stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([usuario, productos, stock]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}