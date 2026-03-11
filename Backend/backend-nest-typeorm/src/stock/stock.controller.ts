import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // GET: Ver stock de todos los productos
  @Get()
  async verTodo() {
    return await this.stockService.findAll();
  }

  // GET: Ver stock de un solo producto (Ej: Grama Kukuyo)
  @Get(':id_producto')
  async verUno(@Param('id_producto', ParseIntPipe) id: number) {
    return await this.stockService.findOne(id);
  }
}
