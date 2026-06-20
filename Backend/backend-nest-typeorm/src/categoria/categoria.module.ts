import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriaService } from './categoria.service';
import { CategoriaController } from './categoria.controller';
import { categoria } from './categoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([categoria])],
  providers: [CategoriaService],
  controllers: [CategoriaController],
  exports: [CategoriaService],
})
export class CategoriaModule { }
