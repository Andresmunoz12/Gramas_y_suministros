import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto-dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Controller('producto')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) { }

  // 1. CREAR: POST /productos
  @Post()
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  // 2. LISTAR TODO: GET /productos
  @Get()
  findAll() {
    return this.productosService.findAll();
  }

  // 3. BUSCAR UNO: GET /productos/5
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  // 4. ACTUALIZAR: PUT /productos/5
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  // 5. ELIMINAR: DELETE /productos/5
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
