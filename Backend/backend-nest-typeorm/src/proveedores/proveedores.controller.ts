import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post() // CREAR
  async crear(@Body() dto: CreateProveedorDto) {
    return await this.proveedoresService.create(dto);
  }

  @Get() // LEER TODOS
  async listar() {
    return await this.proveedoresService.findAll();
  }

  @Get(':id') // LEER UNO
  async obtenerUno(@Param('id', ParseIntPipe) id: number) {
    return await this.proveedoresService.findOne(id);
  }

  @Put(':id') // ACTUALIZAR
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return await this.proveedoresService.update(id, dto);
  }

  @Delete(':id') // ELIMINAR
  async borrar(@Param('id', ParseIntPipe) id: number) {
    return await this.proveedoresService.remove(id);
  }
}
