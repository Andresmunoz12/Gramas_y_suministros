import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProveedoresService } from './proveedores.service';
import { ProveedoresController } from './proveedores.controller';
import { proveedor } from './proveedores.entity'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [TypeOrmModule.forFeature([proveedor])],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
  exports: [ProveedoresService], // Lo exportamos por si acaso otro módulo lo necesita
})
export class ProveedoresModule {}
